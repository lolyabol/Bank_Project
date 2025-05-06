import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const getTransactionsPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ 
            $or: [
                { userId: userId },
                { toAccount: { $in: await Account.find({ userId: userId }).distinct('_id') } }
            ]
        })
        .populate('fromAccount toAccount', 'accountNumber currency userId')
        .sort({ date: -1 })
        .lean();

        // Форматируем данные для отображения
        const formattedTransactions = transactions.map(tx => ({
            ...tx,
            formattedDate: tx.date ? new Date(tx.date).toLocaleString('ru-RU') : '',
            direction: tx.userId.toString() === userId ? 'outgoing' : 'incoming',
            amountFormatted: tx.amount.toFixed(2),
            accountNumber: tx.fromAccount?.accountNumber || tx.toAccount?.accountNumber
        }));

        res.render('transactions', { 
            transactions: formattedTransactions,
            user: req.user
        });
    } catch (error) {
        console.error('Ошибка при получении транзакций:', error);
        res.status(500).render('error', { 
            message: 'Ошибка при получении истории операций',
            user: req.user
        });
    }
};

export const createTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount, fromAccountId, recipientIdentifier } = req.body;
        const userId = req.user.id;

        console.log('Начало обработки перевода:', {
            userId,
            fromAccountId,
            recipientIdentifier,
            amount
        });

        // 1. Валидация суммы
        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            throw new Error('Некорректная сумма перевода');
        }

        // 2. Получаем счет отправителя с проверкой владельца
        const fromAccount = await Account.findOne({
            _id: fromAccountId,
            userId: userId,
            status: 'active'
        }).session(session);

        if (!fromAccount) {
            throw new Error('Счёт отправителя не найден или недоступен');
        }

        // 3. Находим счет получателя
        let toAccount = await Account.findOne({
            $or: [
                { accountNumber: recipientIdentifier },
                { _id: recipientIdentifier }
            ],
            status: 'active'
        }).session(session);

        // Если счет не найден, ищем по телефону
        if (!toAccount) {
            const recipientUser = await User.findOne({ 
                phone: recipientIdentifier 
            }).session(session);

            if (!recipientUser) {
                throw new Error('Получатель не найден');
            }

            toAccount = await Account.findOne({
                userId: recipientUser._id,
                status: 'active'
            }).session(session);

            if (!toAccount) {
                throw new Error('Активный счет получателя не найден');
            }
        }

        // 4. Проверяем возможность перевода
        if (fromAccount.balance < amountNumber) {
            throw new Error(`Недостаточно средств. Доступно: ${fromAccount.balance.toFixed(2)} ${fromAccount.currency}`);
        }

        if (fromAccount._id.equals(toAccount._id)) {
            throw new Error('Нельзя переводить на тот же счет');
        }

        // 5. Создаем записи транзакций
        const transactionData = {
            fromAccount: fromAccount._id,
            toAccount: toAccount._id,
            amount: amountNumber,
            currency: fromAccount.currency,
            date: new Date()
        };

        const outgoingTransaction = new Transaction({
            ...transactionData,
            userId: userId,
            type: 'transfer_out'
        });

        const incomingTransaction = new Transaction({
            ...transactionData,
            userId: toAccount.userId,
            type: 'transfer_in'
        });

        // 6. Обновляем балансы
        fromAccount.balance -= amountNumber;
        toAccount.balance += amountNumber;

        // 7. Сохраняем все изменения в одной транзакции
        await outgoingTransaction.save({ session });
        await incomingTransaction.save({ session });
        await fromAccount.save({ session });
        await toAccount.save({ session });

        await session.commitTransaction();

        console.log('Перевод успешно выполнен:', {
            fromAccount: fromAccount._id,
            toAccount: toAccount._id,
            amount: amountNumber
        });

        return res.json({ 
            success: true,
            message: 'Перевод выполнен успешно',
            transaction: {
                id: outgoingTransaction._id,
                amount: outgoingTransaction.amount,
                currency: outgoingTransaction.currency,
                date: outgoingTransaction.date
            },
            balance: {
                current: fromAccount.balance,
                currency: fromAccount.currency
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Ошибка при выполнении перевода:', error);
        return res.status(400).json({ 
            error: error.message || 'Произошла ошибка при переводе'
        });
    } finally {
        session.endSession();
    }
};