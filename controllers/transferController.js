import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const getTransferPage = (req, res) => {
  res.render('transfer');
};

export const transferBetweenAccounts = async (req, res) => {
  const { fromAccountId, recipientIdentifier, amount } = req.body;

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Пользователь не аутентифицирован' });
    }

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Некорректная сумма перевода' });
    }

    if (fromAccountId === recipientIdentifier) {
      return res.status(400).json({ error: 'Нельзя переводить средства на тот же счёт' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fromAccount = await Account.findOne({ accountNumber: fromAccountId, status: 'active' }).session(session);
      if (!fromAccount) {
        throw new Error('Счёт отправителя не найден или не активен');
      }

      if (fromAccount.userId.toString() !== req.user._id.toString()) {
        throw new Error('У вас нет прав на перевод с этого счёта');
      }

      let toAccount = await Account.findOne({ accountNumber: recipientIdentifier, status: 'active' }).session(session);
      
      if (!toAccount) {
        toAccount = await Account.findOne({ phone: recipientIdentifier, status: 'active' }).session(session);
        if (!toAccount) {
          throw new Error('Счёт получателя не найден или не активен');
        }
      }

      if (fromAccount.balance < transferAmount) {
        throw new Error('Недостаточно средств на счёте отправителя');
      }

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
        type: 'Перевод получен',
        date: new Date(),
      });

      await debitTransaction.save({ session });
      await creditTransaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      console.log(`Пользователь ${req.user.id} перевёл ${transferAmount} RUB с ${fromAccount.accountNumber} на ${toAccount.accountNumber}`);

      return res.status(200).json({ message: 'Перевод успешно выполнен' });
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
       ) statusCode = 409; 

       return res.status(statusCode).json({ error: error.message });
    }
  } catch (outerError) {
    console.error('Внутренняя ошибка сервера при переводе:', outerError);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};