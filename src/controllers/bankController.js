import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const getMainPage = (req, res) => {
    res.render('main', { title: 'Главная страница' });
};

export const getBankPage = async (req, res) => {
    console.log('Запрос на страницу банка от пользователя:', req.user);

    if (!req.user) {
        console.log('Пользователь не аутентифицирован');
        return res.status(401).render('404', { message: 'Пользователь не аутентифицирован' });
    }

    try {
        const user = await User.findById(req.user._id).populate('account');
        console.log('Найденный пользователь:', user);

        if (!user) {
            console.log('Пользователь не найден');
            return res.status(404).render('404', { message: 'Пользователь не найден' });
        }

        if (!user.account) {
            console.log('Аккаунт пользователя не найден');
            return res.status(404).render('404', { message: 'Аккаунт не найден' });
        }

        const transactions = await Transaction.find({ account: user.account._id })
            .sort({ createdAt: -1 })
            .limit(10);
        
        console.log('Транзакции пользователя:', transactions);

        // Рендерим страницу банка с данными пользователя и транзакциями
        res.render('bank', {
            title: 'Банк',
            user,
            transactions
        });
    } catch (error) {
        console.error('Ошибка при получении страницы банка:', error);
        res.status(500).render('404', { message: 'Ошибка сервера' });
    }
};

// API для переводов
export const transferFunds = async (req, res) => {
    try {
        // Логика перевода
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// API для кредитов
export const applyForLoan = async (req, res) => {
    try {
        // Логика кредита
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};