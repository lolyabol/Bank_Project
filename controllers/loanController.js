import Loan from '../models/Loan.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const showLoanForm = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await Account.findOne({ userId, isMain: true });
    
    if (!account) {
      return res.status(400).send('Сначала создайте основной счет');
    }
    
    res.render('loanForm', { 
      account: account.toObject(),
      minAmount: 1000,
      maxTerm: 120,
      interestRates: {
        '12': 10,   
        '24': 12,  
        '36': 15,  
        '60': 18    
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при загрузке формы кредита');
  }
};

export const createLoan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user.id;
    const { amount, term, purpose } = req.body;
    
    const account = await Account.findOne({ userId, isMain: true }).session(session);
    if (!account) {
      throw new Error('Основной счет не найден');
    }
    
    const interestRates = {
      '12': 10, '24': 12, '36': 15, '60': 18
    };
    const interestRate = interestRates[term] || 20; 
    
    const loan = new Loan({
      userId,
      accountNumber: account.accountNumber,
      amount: parseFloat(amount),
      interestRate,
      term: parseInt(term),
      purpose
    });
    
    account.balance += parseFloat(amount);
    
    const transaction = new Transaction({
      userId,
      amount: parseFloat(amount),
      type: 'loan_issued',
      description: `Получение кредита на сумму ${amount} ${account.currency}`,
      status: 'completed'
    });
    
    await loan.save({ session });
    await account.save({ session });
    await transaction.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.redirect('/main/loans');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).send(`Ошибка при оформлении кредита: ${error.message}`);
  }
};

export const makePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user.id;
    const { loanId } = req.params;
    
    const loan = await Loan.findById(loanId).session(session);
    if (!loan || loan.userId.toString() !== userId) {
      throw new Error('Кредит не найден');
    }
    
    const account = await Account.findOne({ userId, isMain: true }).session(session);
    if (!account) {
      throw new Error('Основной счет не найден');
    }
    
    const nextPayment = loan.payments.find(p => p.status === 'pending');
    if (!nextPayment) {
      throw new Error('Нет ожидающих платежей');
    }
    
    if (account.balance < nextPayment.amount) {
      throw new Error('Недостаточно средств для платежа');
    }
    
    account.balance -= nextPayment.amount;
    nextPayment.status = 'paid';
    loan.remainingBalance -= (nextPayment.amount - (loan.remainingBalance * loan.interestRate / 100 / 12));
    
    if (loan.payments.every(p => p.status === 'paid')) {
      loan.status = 'paid';
    }
    
    const transaction = new Transaction({
      userId,
      amount: nextPayment.amount,
      type: 'loan_payment',
      description: `Платеж по кредиту ${loanId}`,
      status: 'completed'
    });
    
    await loan.save({ session });
    await account.save({ session });
    await transaction.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.redirect('/main/loans');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).send(`Ошибка при платеже по кредиту: ${error.message}`);
  }
};