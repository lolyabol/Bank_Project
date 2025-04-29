import Account from '../models/Account.js';

export const getDepositPage = async (req, res) => {
    try {
        const userId = req.user.id;

        // Получаем все активные счета пользователя
        const accounts = await Account.find({ 
            userId,
            status: 'active' 
        }).lean();

        if (!accounts || accounts.length === 0) {
            return res.status(404).render('error', { 
                message: 'У вас нет активных счетов.' 
            });
        }

        // Получаем ID счета из параметров или используем первый
        const accountId = req.params.accountId || req.query.accountId || accounts[0]._id;

        // Находим выбранный счет
        const selectedAccount = accounts.find(acc => 
            acc._id.toString() === accountId.toString()
        ) || accounts[0];

        res.render('deposit', { 
            account: selectedAccount,
            accounts,
            user: res.locals.user
        });
    } catch (error) {
        console.error('Ошибка при загрузке страницы пополнения:', error);
        res.status(500).render('error', { 
            message: 'Ошибка при загрузке страницы пополнения.' 
        });
    }
};

export const postDeposit = async (req, res) => {
    try {
        const { accountId, amount } = req.body;
        const userId = req.user.id;

        console.log('Received accountId:', accountId);
        console.log('Received amount:', amount);
        console.log('User ID:', userId);

        // Валидация суммы
        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            return res.status(400).render('deposit', { 
                error: 'Сумма должна быть числом и больше нуля.',
                ...(await getAccountData(userId, accountId))
            });
        }

        // Проверяем наличие счета
        const account = await Account.findOne({ _id: accountId, userId });
        
        if (!account || account.status !== 'active') {
            return res.status(404).render('deposit', { 
                error: 'Счет не найден или не принадлежит вам.',
                ...(await getAccountData(userId, accountId))
            });
        }

        // Обновляем баланс
        const updatedAccount = await Account.findOneAndUpdate(
            { _id: accountId },
            { $inc: { balance: amountNumber } },
            { new: true }
        );

        if (!updatedAccount) {
            return res.status(500).render('deposit', { 
                error: 'Не удалось обновить баланс счета.',
                ...(await getAccountData(userId, accountId))
            });
        }

        res.redirect('/main/home');
    } catch (error) {
        console.error('Ошибка при пополнении счета:', error);
        res.status(500).render('error', { 
            message: 'Ошибка при пополнении счета.' 
        });
    }
};

// Вспомогательная функция для получения данных счета
async function getAccountData(userId, accountId = null) {
    const accounts = await Account.find({ userId, status: 'active' }).lean();
    const account = accountId 
        ? accounts.find(a => a._id.toString() === accountId.toString())
        : accounts[0];
    
    return { accounts, account };
}