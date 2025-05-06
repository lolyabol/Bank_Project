import Loan from '../models/Loan.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { fetchExchangeRate } from './transferController.js';

export const loansPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const loans = await Loan.find({ userId }).lean();
        
        res.render('loans', { loans });
    } catch (error) {
        console.error('Ошибка при загрузке страницы кредитов:', error);
        res.status(500).render('errorPage', {
            message: 'Ошибка при загрузке страницы кредитов',
            error: error.message
        });
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
};

export const showLoanForm = async (req, res) => {
    try {
        const userId = req.user.id;
        const accounts = await Account.find({ userId, status: 'active' }).lean();
        
        if (accounts.length === 0) {
            return res.status(400).render('errorPage', {
                message: 'У вас нет активных счетов',
                error: 'Для оформления кредита необходимо иметь хотя бы один активный счет',
                redirectUrl: '/main/accounts/new'
            });
        }
        
        res.render('loanForm', {
            accounts,
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
        res.status(500).render('errorPage', {
            message: 'Ошибка при загрузке формы кредита',
            error: error.message
        });
    }
};

const COMMISSION_RATE = 0.01; 

export const createLoan = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const userId = req.user.id;
        const { amount, term, purpose, accountId } = req.body;
        
        if (!accountId) {
            throw new Error('Не выбран счет для зачисления кредита');
        }
        
        const account = await Account.findById(accountId).session(session);
        if (!account || account.userId.toString() !== userId) {
            throw new Error('Выбранный счет не найден');
        }
        
        const loanAmount = parseFloat(amount);
        if (isNaN(loanAmount) || loanAmount <= 0) {
            throw new Error('Неверная сумма кредита');
        }

        const interestRates = { '12': 10, '24': 12, '36': 15, '60': 18 };
        const interestRate = interestRates[term];
        if (!interestRate) {
            throw new Error('Неверный срок кредита');
        }
        
        let amountToCredit = loanAmount;
        let exchangeRate = 1;
        let commission = 0;
        
        if (account.currency !== 'RUB') {
            exchangeRate = await fetchExchangeRate('RUB', account.currency);
            amountToCredit = loanAmount * exchangeRate;
            commission = amountToCredit * COMMISSION_RATE;
            amountToCredit -= commission;
        }
        
        const { monthlyPayment, payments, remainingBalance } = calculatePaymentSchedule(
            loanAmount, 
            interestRate,
            parseInt(term)
        );
        
        const loan = new Loan({
            userId,
            accountNumber: account.accountNumber,
            accountId: account._id,
            amount: loanAmount, 
            creditedAmount: amountToCredit, 
            interestRate,
            term: parseInt(term),
            purpose,
            startDate: new Date(),
            payments,
            remainingBalance,
            monthlyPayment,
            status: 'Активный',
            currency: 'RUB',
            exchangeRate: account.currency !== 'RUB' ? exchangeRate : undefined,
            commission: account.currency !== 'RUB' ? commission : 0
        });
        
        account.balance += amountToCredit;
        
        const transaction = new Transaction({
            userId,
            toAccount: account._id,
            amount: loanAmount,
            convertedAmount: account.currency !== 'RUB' ? amountToCredit : undefined,
            currency: 'RUB',
            targetCurrency: account.currency,
            exchangeRate: account.currency !== 'RUB' ? exchangeRate : undefined,
            commission: account.currency !== 'RUB' ? commission : undefined,
            type: 'loan_approval',
            description: `Одобрение кредита на сумму ${loanAmount} RUB (зачислено ${amountToCredit.toFixed(2)} ${account.currency})`,
            status: 'completed'
        });
        
        await loan.save({ session });
        await account.save({ session });
        await transaction.save({ session });
        
        await session.commitTransaction();
        
        req.session.successMessage = `Кредит на сумму ${loanAmount} RUB успешно оформлен. Зачислено ${amountToCredit.toFixed(2)} ${account.currency} на счет ${account.accountNumber}`;
        res.redirect('/main/loans');
        
    } catch (error) {
        await session.abortTransaction();
        console.error('Ошибка при создании кредита:', error);
        res.status(400).render('error', {
            message: 'Ошибка при оформлении кредита',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

export const makePayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        const { loanId } = req.params;
        const { paymentAmount, fromAccountId } = req.body;

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

        const fromAccount = await Account.findById(fromAccountId).session(session);
        if (!fromAccount || fromAccount.userId.toString() !== userId) {
            throw new Error('Счет для списания не найден');
        }

        if (fromAccount.balance < amount) {
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

        fromAccount.balance -= amount;

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
            fromAccount: fromAccount._id,
            toAccount: loan.accountId,
            amount: amount,
            type: 'loan_payment',
            description: `Платеж по кредиту ${loan._id}`,
            currency: fromAccount.currency,
            status: 'completed'
        });

        await Promise.all([
            loan.save({ session }),
            fromAccount.save({ session }),
            transaction.save({ session })
        ]);

        await session.commitTransaction();
        
        req.session.successMessage = `Платеж по кредиту на сумму ${amount.toFixed(2)} ${fromAccount.currency} успешно проведен`;
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