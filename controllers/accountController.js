import Account from "../models/Account.js";
import User from '../models/User.js'; 
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

const generateUniqueAccountNumber = async () => {
  let isUnique = false;
  let accountNumber;

  while (!isUnique) {
      accountNumber = '40702' + Math.floor(100000 + Math.random() * 900000); 
      
      const existingAccount = await Account.findOne({ accountNumber });
      isUnique = !existingAccount; 
  }

  return accountNumber;
};

export const createAccount = async (req, res) => {
  const { userId } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const accountNumber = await generateUniqueAccountNumber();

    const newAccount = new Account({
      userId: user._id,
      accountNumber, 
      balance: 0,
      currency: 'RUB',
    });

    await newAccount.save();

    res.redirect(`/main/home`);
  } catch (error) {
    console.error('Ошибка при создании аккаунта:', error);
    res.status(500).json({ message: 'Ошибка при создании аккаунта', error });
  }
};

export const accountCreated = async (req, res) => {
    const { userId } = req.query;
  
    try {
      const account = await Account.findOne({ userId }).sort({ createdAt: -1 });
  
      if (!account) {
        return res.status(404).send('Аккаунт не найден.');
      }

      res.render('accountCreated', { account });
    } catch (error) {
      console.error('Ошибка при получении информации об аккаунте:', error);
      res.status(500).send('Ошибка при получении информации об аккаунте.');
    }
  };

export const getAccountsPage = async (req, res) => {
  try {
      const userId = req.user.id;
      const account = await Account.findOne({ userId }).populate('userId').lean(); 

      if (!account) {
          return res.status(404).json({ message: 'Аккаунт не найден' });
      }

      res.render('account', { account });
  } catch (error) {
      console.error('Ошибка при получении данных о счете:', error);
      res.status(500).json({ message: 'Ошибка при получении данных о счете', error });
  }
};

export const depositToAccount = async (req, res) => {
  const { accountId, amount } = req.body;

  const amountNumber = Number(amount);

  if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ message: 'Некорректная сумма пополнения' });
  }

  try {
      const account = await Account.findById(accountId);
      if (!account) {
          return res.status(404).json({ message: 'Аккаунт не найден' });
      }

      account.balance += amountNumber;
      await account.save();

      const transaction = new Transaction({
        userId: req.user.id,
        amount: amountNumber,
        type: 'Пополнение',
    });
    await transaction.save();
      await transaction.save();

      res.redirect('/main/home'); // Редирект на главную страницу после пополнения
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при пополнении счета', error });
    }
};

export const transferBetweenAccounts = async (req, res) => {
  const { recipientIdentifier, amount } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Пользователь не аутентифицирован' });
    }

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Некорректная сумма перевода' });
    }

    // Находим активный счет отправителя
    const fromAccount = await Account.findOne({ userId: req.user.id, status: 'active' });
    if (!fromAccount) {
      return res.status(404).json({ error: 'Активный счёт отправителя не найден' });
    }

    // Ищем пользователя-получателя по телефону или имени
    // Предполагается, что в модели User есть поля phone и name
    const recipientUser = await User.findOne({
      $or: [
        { phone: recipientIdentifier },
        { name: recipientIdentifier }
      ]
    });

    if (!recipientUser) {
      return res.status(404).json({ error: 'Пользователь-получатель не найден' });
    }

    // Находим активный счет получателя
    const toAccount = await Account.findOne({ userId: recipientUser._id, status: 'active' });
    if (!toAccount) {
      return res.status(404).json({ error: 'Активный счёт получателя не найден' });
    }

    if (fromAccount.accountNumber === toAccount.accountNumber) {
      return res.status(400).json({ error: 'Нельзя переводить средства на тот же счёт' });
    }

    if (fromAccount.balance < transferAmount) {
      return res.status(409).json({ error: 'Недостаточно средств на счёте отправителя' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      fromAccount.balance -= transferAmount;
      toAccount.balance += transferAmount;

      await fromAccount.save({ session });
      await toAccount.save({ session });

      const debitTransaction = new Transaction({
        userId: fromAccount.userId,
        amount: transferAmount,
        type: 'Перевод отправлен',
        date: new Date(),
      });

      const creditTransaction = new Transaction({
        userId: toAccount.userId,
        amount: transferAmount,
        type: 'Пополнение',
        date: new Date(),
      });

      await debitTransaction.save({ session });
      await creditTransaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      console.log(`Пользователь ${req.user._id} перевёл ${transferAmount} RUB с ${fromAccount.accountNumber} на ${toAccount.accountNumber}`);

      return res.redirect('/main/home');
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error(`Ошибка при переводе пользователя ${req.user._id}:`, error.message);

      let statusCode = 400;
      
      if (
        error.message.includes('не найден') ||
        error.message.includes('не активен')
       ) statusCode = 404;
      
       if (
         error.message.includes('прав') ||
         error.message.includes('аутентифицирован')
       ) statusCode = 403;

       if (
         error.message.includes('Недостаточно средств')
       ) statusCode = 409; // конфликт

       return res.status(statusCode).json({ error: error.message });
    }
  } catch (outerError) {
    console.error('Внутренняя ошибка сервера при переводе:', outerError);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const createSavingsAccount = async (req, res) => {
    const { userId } = req.body;

    try {
      const savingsAccountNumber = await generateUniqueSavingsAccountNumber();

      const savingsAccount = new Account({
          userId,
          accountNumber: savingsAccountNumber,
          balance: 0,
          currency: 'RUB',
          status: 'active'
      });

      await savingsAccount.save();
      res.redirect('/main/account'); 
    } catch (error) {
      console.error('Ошибка при создании сберегательного счета:', error);
      res.status(500).json({ message: 'Ошибка при создании сберегательного счета', error });
    }
};