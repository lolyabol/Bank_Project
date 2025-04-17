// accountController.js
import Account from "../models/Account.js";

export const addAccountNumber = async (req, res) => {
    const { userId, accountNumber } = req.body;

    try {
        const account = await Account.findOne({ userId });
        
        if (!account) {
            return res.status(404).send('Аккаунт не найден');
        }

        account.accountNumber = accountNumber; // Устанавливаем номер счета
        await account.save(); // Сохраняем изменения

        return res.send('Номер счета успешно добавлен');
    } catch (error) {
        console.error('Ошибка при добавлении номера счета:', error.message);
        return res.status(500).send('Ошибка сервера');
    }
};