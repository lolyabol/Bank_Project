import Transaction from '../models/Transaction.js';

export const getTransactionsPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ userId }).lean();

        // Форматируем дату для удобного отображения
        transactions.forEach(tx => {
            tx.formattedDate = tx.date ? new Date(tx.date).toLocaleString('ru-RU') : '';
        });

        res.render('transactions', { transactions }); // Рендерим отдельную страницу
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении транзакций', error });
    }
};

export const createTransaction = async (req, res) => {
    const { amount } = req.body;
    
    try {
        const amountNumber = Number(amount);
        if (isNaN(amountNumber) || amountNumber === 0) {
            return res.status(400).json({ message: 'Некорректная сумма' });
        }

        const transactionType = amountNumber > 0 ? 'Пополнение' : 'Списание';

        const transaction = new Transaction({
            userId: req.user.id,
            amount: Math.abs(amountNumber),
            type: transactionType,
        });

        await transaction.save();
        res.redirect('/main/home');
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании транзакции', error });
    }
};