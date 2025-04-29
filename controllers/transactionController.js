import Transaction from '../models/Transaction.js';

export const getTransactionsPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ userId }).populate('fromAccount toAccount').lean();

        transactions.forEach(tx => {
            tx.formattedDate = tx.date ? new Date(tx.date).toLocaleString('ru-RU') : '';
            tx.fromAccountName = tx.fromAccount ? tx.fromAccount.name : '';
            tx.toAccountName = tx.toAccount ? tx.toAccount.name : '';
        });

        res.render('transactions', { transactions });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении транзакций', error });
    }
};

export const createTransaction = async (req, res) => {
    const { amount, fromAccountId, toAccountId, currency } = req.body; 
    
    try {
        const amountNumber = Number(amount);
        if (isNaN(amountNumber) || amountNumber === 0) {
            return res.status(400).json({ message: 'Некорректная сумма' });
        }

        const transactionType = amountNumber > 0 ? 'Пополнение' : 'Списание';

        const transaction = new Transaction({
            userId: req.user.id,
            fromAccount: fromAccountId,
            toAccount: toAccountId,
            amount: Math.abs(amountNumber),
            type: transactionType,
            currency: currency || 'RUB', 
            date: new Date()
        });

        await transaction.save();
        res.redirect('/main/home');
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании транзакции', error });
    }
};