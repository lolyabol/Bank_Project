import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
    const { username, password, email, phone, fullName } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { title: 'Регистрация', message: 'Пользователь с таким адресом электронной почты уже существует.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, email, phone, fullName });
        await newUser.save();

        req.session.userId = newUser._id;

        res.redirect('/createAccount'); 
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.render('register', { title: 'Регистрация', message: 'Ошибка при регистрации.' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        
        if (!user) return res.render('login', { title: 'Вход', message: 'Пользователь не найден.' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) return res.render('login', { title: 'Вход', message: 'Неверный пароль.' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        
        res.cookie('token', token, { httpOnly: true });

        req.session.userId = user._id;

        res.redirect('/main/home');
    } catch (error) {
        console.error('Ошибка при входе:', error); 
        res.render('login', { title: 'Вход', message: 'Ошибка при входе.' });
    }
};

export const logoutUser = (req, res) => {
    res.clearCookie('token');
    req.session.destroy(err => {
        if (err) {
            console.error('Ошибка при выходе:', err);
            return res.render('login', { title: 'Вход', message: 'Ошибка при выходе.' });
        }
        res.redirect('/login');
    });
};