import Account from '../models/Account.js';

export const getDepositPage = async (req, res) => {
    const userId = req.user.id;
    const account = await Account.findOne({ userId }).lean();
    
    if (!account) {
        return res.status(404).send('Аккаунт не найден.');
    }

    res.render('deposit', { account });
};

export const postDeposit = async (req, res) => {
    const { accountId, amount } = req.body;

    // Преобразуем amount к числу
    const amountNumber = Number(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
        return res.status(400).send('Некорректная сумма пополнения.');
    }

    try {
        await Account.findByIdAndUpdate(accountId, { $inc: { balance: amountNumber } });
        res.redirect('/main/home'); // Перенаправление на главную страницу после успешного пополнения
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при пополнении счета.');
    }
};