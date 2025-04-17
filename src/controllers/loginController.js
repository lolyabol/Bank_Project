import User from '../models/User.js';
import { comparePasswords } from '../services/passwordService.js';

export const LoginPage = (req, res) => {
    res.render('login');
};

export const handleLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Пользователь не найден' });
        }

        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        req.session.userId = user._id;
        req.session.email = user.email;

        return res.redirect('/main/home'); // Перенаправляем на страницу home
    } catch (error) {
        console.error('Ошибка во время входа:', error);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
};