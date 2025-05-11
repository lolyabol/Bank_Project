import Loan from '../models/Loan.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { fetchExchangeRate, getCommissionRate } from './transferController.js';

const logger = {
  info: (message, data) => console.log(`[INFO] ${new Date().toISOString()} ${message}`, data),
  error: (message, data) => console.error(`[ERROR] ${new Date().toISOString()} ${message}`, data)
};

export const loansPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const loans = await Loan.find({ userId }).lean();
        const userAccounts = await Account.find({ userId, status: 'active' }).lean();
        
        res.render('loans', { 
            loans,
            userAccounts
        });
    } catch (error) {
        logger.error('Ошибка при загрузке страницы кредитов', { error: error.message });
        res.status(500).render('error', {
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
        logger.error('Ошибка при загрузке формы кредита', { error: error.message });
        res.status(500).render('errorPage', {
            message: 'Ошибка при загрузке формы кредита',
            error: error.message
        });
    }
};

export const createLoan = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const userId = req.user.id;
        const { amount, term, purpose, accountId } = req.body;
        
        if (!accountId) {
          if (req.flash) req.flash('errorMessage', 'Не выбран счет для зачисления кредита');
          throw new Error('Не выбран счет для зачисления кредита');
        }
        
        const account = await Account.findById(accountId).session(session);
        if (!account || account.userId.toString() !== userId) {
          if (req.flash) req.flash('errorMessage', 'Выбранный счет не найден');
          throw new Error('Выбранный счет не найден');
        }
        
        const loanAmount = parseFloat(amount);
        if (isNaN(loanAmount) || loanAmount < 1000) {
          if (req.flash) req.flash('errorMessage', 'Минимальная сумма кредита - 1000 RUB');
          throw new Error('Минимальная сумма кредита - 1000 RUB');
        }
  
        const interestRates = { '12': 10, '24': 12, '36': 15, '60': 18 };
        const interestRate = interestRates[term];
        if (!interestRate) {
          if (req.flash) req.flash('errorMessage', 'Неверный срок кредита');
          throw new Error('Неверный срок кредита');
        }
        
        let amountToCredit = loanAmount;
        let exchangeRate = 1;
        let commission = 0;
        
        if (account.currency !== 'RUB') {
          exchangeRate = await fetchExchangeRate('RUB', account.currency);
          amountToCredit = loanAmount * exchangeRate;
          commission = amountToCredit * getCommissionRate();
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
      });
      
      if (req.flash) {
        req.flash('successMessage', `Кредит на сумму ${req.body.amount} RUB успешно оформлен`);
      }
      return res.redirect('/main/loans');
      
    } catch (error) {
      logger.error('Ошибка при создании кредита', { error: error.message });
      if (req.flash) {
        req.flash('errorMessage', error.message || 'Произошла ошибка при оформлении кредита');
      }
      return res.redirect('/main/loans/new');
    } finally {
      session.endSession();
    }
  };

export const makePayment = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
      await session.withTransaction(async () => {
          const { loanId } = req.params;
          const { paymentAmount, fromAccountId } = req.body;
          const userId = req.user.id;

          if (!paymentAmount || !fromAccountId) {
              throw new Error('Необходимо указать сумму и счет для списания');
          }

          const amount = parseFloat(paymentAmount);
          if (isNaN(amount) || amount <= 0) {
              throw new Error('Неверная сумма платежа');
          }

          const [loan, fromAccount] = await Promise.all([
              Loan.findById(loanId).session(session),
              Account.findById(fromAccountId).session(session)
          ]);

          if (!loan || loan.userId.toString() !== userId) {
              throw new Error('Кредит не найден');
          }
          if (!fromAccount || fromAccount.userId.toString() !== userId) {
              throw new Error('Счет не найден');
          }

          const nextPayment = loan.payments.find(p => p.status === 'Ожидает оплаты');
          if (!nextPayment) {
              throw new Error('Нет платежей для оплаты');
          }

          let amountToDebit;
          let exchangeRate = 1;
          let commission = 0;

          if (fromAccount.currency !== loan.currency) {
              exchangeRate = await fetchExchangeRate(loan.currency, fromAccount.currency);
              
              amountToDebit = nextPayment.amount * exchangeRate;
              commission = amountToDebit * getCommissionRate();
              amountToDebit += commission;
              
              if (amount < amountToDebit) {
                  throw new Error(`Минимальная сумма: ${amountToDebit.toFixed(2)} ${fromAccount.currency}`);
              }
          } else {
              if (amount < nextPayment.amount) {
                  throw new Error(`Минимальная сумма: ${nextPayment.amount} ${loan.currency}`);
              }
              amountToDebit = nextPayment.amount;
          }

          if (fromAccount.balance < amountToDebit) {
              throw new Error(`Недостаточно средств. Нужно: ${amountToDebit.toFixed(2)} ${fromAccount.currency}, есть: ${fromAccount.balance} ${fromAccount.currency}`);
          }

          fromAccount.balance -= amountToDebit;
          
          nextPayment.status = 'Оплаченный';
          nextPayment.paidAmount = nextPayment.amount;
          nextPayment.paymentDate = new Date();

          const interestPayment = loan.remainingBalance * (loan.interestRate / 100 / 12);
          const principalPayment = nextPayment.amount - interestPayment;
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
              amount: amountToDebit,
              convertedAmount: fromAccount.currency !== loan.currency ? nextPayment.amount : undefined,
              currency: fromAccount.currency,
              targetCurrency: loan.currency,
              exchangeRate: fromAccount.currency !== loan.currency ? exchangeRate : undefined,
              commission: fromAccount.currency !== loan.currency ? commission : undefined,
              type: 'loan_payment',
              description: `Платеж по кредиту ${loan.accountNumber}`,
              status: 'completed'
          });

          await Promise.all([
              loan.save({ session }),
              fromAccount.save({ session }),
              transaction.save({ session })
          ]);
      });

      return res.json({ 
          success: true,
          message: 'Платеж успешно выполнен'
      });
      
  } catch (error) {
      logger.error('Ошибка платежа', { 
          error: error.message,
          stack: error.stack,
          params: req.params,
          body: req.body
      });
      return res.status(400).json({
          success: false,
          message: error.message
      });
  } finally {
      session.endSession();
  }
};

export const getLoansData = async (req, res) => {
  try {
      const userId = req.user.id;
      const loans = await Loan.find({ userId }).lean();
      
      const activeLoans = loans.filter(loan => loan.status === 'Активный');
      const paidLoans = loans.filter(loan => loan.status === 'Оплаченный');
      
      res.json({
          success: true,
          activeLoans,
          paidLoans
      });
  } catch (error) {
      logger.error('Ошибка при получении данных о кредитах', { error: error.message });
      res.status(500).json({
          success: false,
          message: 'Ошибка при получении данных о кредитах'
      });
  }
};