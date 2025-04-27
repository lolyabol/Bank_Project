import Loan from '../models/Loan.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const loansPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const loans = await Loan.find({ userId }).lean(); 
        
        res.render('loans', { loans });
    } catch (error) {
        console.error('Ошибка при загрузке страницы кредитов:', error);
        res.status(500).send('Ошибка при загрузке страницы кредитов');
    }
};

const calculatePaymentSchedule = (amount, interestRate, term) => {
  const monthlyRate = interestRate / 100 / 12; 
  const totalPayments = term; 
  const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
  
  const payments = [];
  
  for (let i = 0; i < totalPayments; i++) {
      payments.push({
          date: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000), 
          amount: parseFloat(monthlyPayment.toFixed(2)), 
          status: 'Ожидает оплаты'
      });
  }
  
  return {
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)), 
      payments,
      remainingBalance: amount 
  };
}

export const showLoanForm = async (req, res) => {
    try {
        const userId = req.user.id;
        const account = await Account.findOne({ userId, isMain: true });
        
        if (!account) {
            return res.status(400).send('Сначала создайте основной счет');
        }
        
        res.render('loanForm', { 
            account,
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
      
      const account = await Account.findOne({ userId, isMain:true }).session(session);
      if (!account) {
          throw new Error('Основной счет не найден');
      }
      
      const interestRates = { '12': 10, '24': 12, '36': 15, '60': 18 };
      const interestRate = interestRates[term];
      if (!interestRate) {
          throw new Error('Неверный срок кредита');
      }
      
      const { monthlyPayment, payments, remainingBalance } = calculatePaymentSchedule(amount, interestRate, term);
      
      const loan = new Loan({
          userId,
          accountNumber : account.accountNumber,
          amount,
          interestRate,
          term,
          purpose,
          startDate : new Date(),
          payments,
          remainingBalance,
          monthlyPayment
      });
      
      account.balance += parseFloat(amount);
      
      const transaction = new Transaction({
          userId,
          amount,
          type : 'Одобрение кредита',
          description : `Кредит на ${purpose || 'личные нужды'}`,
          status : 'completed'
      });
      
      await loan.save({ session });
      await account.save({ session });
      await transaction.save({ session });
      
      await session.commitTransaction();
  } catch (error) {
     await session.abortTransaction();
     console.error('Ошибка при создании кредита:', error);
     return res.status(500).render('error', { 
         message : 'Ошибка при оформлении кредита',
         error : error.message 
     });
  } finally {
     session.endSession();
     res.redirect('/main/loans');
  }
};

export const makePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { loanId } = req.params;
    const { paymentAmount } = req.body;

    if (!paymentAmount || isNaN(paymentAmount)) {
      throw new Error('Укажите корректную сумму платежа');
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      throw new Error('Сумма платежа должна быть положительной');
    }

    const loan = await Loan.findById(loanId).session(session);
    if (!loan || loan.userId.toString() !== userId) {
      throw new Error('Кредит не найден');
    }

    const account = await Account.findOne({ userId, isMain: true }).session(session);
    if (!account) {
      throw new Error('Основной счет не найден');
    }

    if (account.balance < amount) {
      throw new Error('Недостаточно средств на счете');
    }

    const nextPayment = loan.payments.find(p => p.status === 'Ожидает оплаты');
    if (!nextPayment) {
      throw new Error('Нет ожидающих платежей');
    }

    const minPayment = nextPayment.amount * 0.9; 
    if (amount < minPayment) {
      throw new Error(`Минимальная сумма платежа: ${minPayment.toFixed(2)}`);
    }

    account.balance -= amount;

    nextPayment.status = 'Оплаченный';
    nextPayment.paidAmount = amount;
    nextPayment.paymentDate = new Date();

    const interestPayment = loan.remainingBalance * (loan.interestRate / 100 / 12);
    const principalPayment = amount - interestPayment;
    loan.remainingBalance -= principalPayment;

    if (loan.remainingBalance <= 0) {
      loan.status = 'Оплаченный';
      loan.remainingBalance = 0;
      loan.payments.forEach(p => {
        if (p.status === 'Ожидает оплаты') p.status = 'Оплаченный';
      });
    }

    const transaction = new Transaction({
      userId,
      amount: amount,
      type: 'Оплата кредита',
      description: `Платеж по кредиту ${loan._id}`,
      status: 'completed'
    });

    await Promise.all([
      loan.save({ session }),
      account.save({ session }),
      transaction.save({ session })
    ]);

    await session.commitTransaction();
    
	res.redirect('/main/loans');

  } catch (error) {
	await session.abortTransaction();
	console.error('Ошибка платежа:', error);
	
	res.status(400).render('paymentError', { 
	  error: error.message,
	  loanId: req.params.loanId 
	});
	
  } finally {
	session.endSession();
  }
};
