import SavingsAccount from '../models/SavingsAccount.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

const generateUniqueSavingsAccountNumber = async () => {
  let isUnique = false;
  let accountNumber;

  while (!isUnique) {
    accountNumber = '40802' + Math.floor(100000 + Math.random() * 900000);
    const existing = await SavingsAccount.findOne({ accountNumber });
    isUnique = !existing;
  }

  return accountNumber;
};

export const showCreateForm = (req, res) => {
  res.render('createSavingsAccount');
};

export const createSavingsAccount = async (req, res) => {
  const userId = req.user.id;

  try {
    const mainAccount = await Account.findOne({ 
      userId, 
      status: 'active' 
    }).sort({ isMain: -1 });
    
    if (!mainAccount) {
      return res.status(400).render('error', { 
        message: 'У вас нет активных счетов. Сначала создайте хотя бы один счёт.' 
      });
    }

    const existingSavingsAccount = await SavingsAccount.findOne({ userId });
    if (existingSavingsAccount) {
      return res.status(400).render('error', { 
        message: 'У вас уже есть сберегательный счёт. Можно создать только один.' 
      });
    }

    const accountNumber = await generateUniqueSavingsAccountNumber();

    const newAccount = new SavingsAccount({
      userId,
      accountNumber,
      balance: 0,
      currency: mainAccount.currency,
      status: 'active'
    });

    await newAccount.save();
    
    req.session.successMessage = 'Сберегательный счёт успешно создан!';
    res.redirect('/main/saving-account');
    
  } catch (error) {
    console.error('Ошибка при создании сберегательного счета:', error);
    res.status(500).render('error', { 
      message: 'Ошибка при создании сберегательного счета',
      error: error.message 
    });
  }
};

export const getSavingsAccountPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const savingsAccount = await SavingsAccount.findOne({ userId }).lean();
    const accounts = await Account.find({ userId, status: 'active' }).lean();

    if (!savingsAccount) {
      return res.redirect('/main/saving-account/create');
    }

    res.render('savingAccount', { 
      savingsAccount,
      accounts,
      successMessage: req.session.successMessage,
      error: req.session.error
    });
    
    delete req.session.successMessage;
    delete req.session.error;
    
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { 
      message: 'Ошибка при получении данных' 
    });
  }
};

export const depositToSavingsAccount = async (req, res) => {
  let session;
  try {
    const userId = req.user.id;
    const { amount, fromAccountId } = req.body;

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      req.session.error = 'Неверная сумма перевода';
      return res.redirect('/main/saving-account');
    }

    session = await mongoose.startSession();
    
    await session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      maxCommitTimeMS: 1000
    });

    const [fromAccount, savingsAccount] = await Promise.all([
      Account.findOne({ _id: fromAccountId, userId }).session(session),
      SavingsAccount.findOne({ userId }).session(session)
    ]);

    if (!fromAccount || !savingsAccount) {
      await session.abortTransaction();
      req.session.error = 'Счёт не найден';
      return res.redirect('/main/saving-account');
    }

    if (fromAccount.balance < amountNumber) {
      await session.abortTransaction();
      req.session.error = 'Недостаточно средств на выбранном счёте';
      return res.redirect('/main/saving-account');
    }

    if (fromAccount.currency !== savingsAccount.currency) {
      await session.abortTransaction();
      req.session.error = 'Нельзя переводить между счетами в разных валютах';
      return res.redirect('/main/saving-account');
    }

    fromAccount.balance -= amountNumber;
    savingsAccount.balance += amountNumber;

    const transaction = new Transaction({
      userId,
      fromAccount: fromAccount._id,
      toAccount: savingsAccount._id,
      amount: amountNumber,
      convertedAmount: amountNumber,
      currency: fromAccount.currency,
      targetCurrency: savingsAccount.currency,
      exchangeRate: 1,
      type: 'savings_deposit',
      status: 'completed',
      description: 'Пополнение сберегательного счета'
    });

    await fromAccount.save({ session });
    await savingsAccount.save({ session });
    await transaction.save({ session });

    await session.commitTransaction();
    
    req.session.successMessage = `Успешно переведено ${amountNumber.toFixed(2)} ${savingsAccount.currency} на сберегательный счёт`;
    return res.redirect('/main/saving-account');

  } catch (error) {
    console.error('Ошибка при пополнении:', error);
    
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    
    req.session.error = 'Ошибка при выполнении перевода';
    return res.redirect('/main/saving-account');
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

export const withdrawFromSavingsAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const userId = req.user.id;
    const { amount, toAccountId } = req.body;

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      req.session.error = 'Неверная сумма перевода';
      return res.redirect('/main/saving-account');
    }

    const [toAccount, savingsAccount] = await Promise.all([
      Account.findOne({ _id: toAccountId, userId }).session(session),
      SavingsAccount.findOne({ userId }).session(session)
    ]);

    if (!toAccount || !savingsAccount) {
      req.session.error = 'Счёт не найден';
      return res.redirect('/main/saving-account');
    }

    if (savingsAccount.balance < amountNumber) {
      req.session.error = 'Недостаточно средств на сберегательном счёте';
      return res.redirect('/main/saving-account');
    }

    if (toAccount.currency !== savingsAccount.currency) {
      req.session.error = 'Нельзя переводить между счетами в разных валютах';
      return res.redirect('/main/saving-account');
    }

    savingsAccount.balance -= amountNumber;
    toAccount.balance += amountNumber;

    const transaction = new Transaction({
      userId,
      fromAccount: savingsAccount._id,
      toAccount: toAccount._id,
      amount: amountNumber,
      convertedAmount: amountNumber,
      currency: savingsAccount.currency,
      targetCurrency: toAccount.currency,
      exchangeRate: 1,
      type: 'savings_withdrawal',
      status: 'completed',
      description: 'Снятие со сберегательного счета'
    });

    await Promise.all([
      toAccount.save({ session }),
      savingsAccount.save({ session }),
      transaction.save({ session })
    ]);

    await session.commitTransaction();
    session.endSession();

    req.session.successMessage = `Успешно переведено ${amountNumber.toFixed(2)} ${savingsAccount.currency} с сберегательного счёта`;
    res.redirect('/main/saving-account');

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Ошибка при снятии:', error);
    req.session.error = 'Ошибка при выполнении перевода';
    res.redirect('/main/saving-account');
  }
};