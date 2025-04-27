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
    const mainAccount = await Account.findOne({ userId, isMain: true });
    if (!mainAccount) {
      return res.status(400).json({ message: 'Сначала создайте основной счет' });
    }

    const existing = await SavingsAccount.findOne({ userId });
    if (existing) {
      return res.status(400).json({ message: 'Сберегательный счет уже существует' });
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
    res.redirect('/main/saving-account');
  } catch (error) {
    console.error('Ошибка при создании сберегательного счета:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании сберегательного счета',
      error: error.message 
    });
  }
};

export const getSavingsAccountPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await SavingsAccount.findOne({ userId }).lean();

    if (!account) {
      return res.redirect('/main/saving-account/create');
    }

    res.render('savingAccount', { account });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при получении данных о сберегательном счете');
  }
};

export const depositToSavingsAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send('Неверная сумма перевода');
    }

    const savingsAccount = await SavingsAccount.findOne({ userId });
    if (!savingsAccount) {
      return res.status(404).send('Сберегательный счет не найден');
    }

    const mainAccount = await Account.findOne({ userId, isMain: true });
    if (!mainAccount) {
      return res.status(404).send('Основной счет не найден');
    }

    if (mainAccount.balance < amount) {
      return res.status(400).send('Недостаточно средств на основном счете');
    }

    if (mainAccount.currency !== savingsAccount.currency) {
      return res.status(400).send('Нельзя переводить между счетами в разных валютах');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      mainAccount.balance -= parseFloat(amount);
      await mainAccount.save({ session });

      savingsAccount.balance += parseFloat(amount);
      await savingsAccount.save({ session });

      const transaction = new Transaction({
        fromAccount: mainAccount.accountNumber,
        toAccount: savingsAccount.accountNumber,
        amount,
        currency: savingsAccount.currency,
        type: 'Перевод на сберегательный счёт',
        userId,
        status: 'completed'
      });
      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.redirect('/main/saving-account');
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при выполнении перевода');
  }
};