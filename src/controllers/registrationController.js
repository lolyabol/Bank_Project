import { sendSmsVerification } from '../services/smsService.js';
import User from '../models/User.js'; // Импортируйте модель User
import Account from '../models/Account.js'; // Импортируйте модель Account

export const RegistrationPage = (req, res) => {
    res.render('registration', { 
        title: 'Регистрация в онлайн-банке',
        securityInfo: true,
        formData: req.session.formData || {},
        error: req.session.error
    });
    
    delete req.session.formData;
    delete req.session.error;
};

export const registerUser = async (req, res) => {
    const { fullName, phone, email, password } = req.body;

    try {
        console.log('Получены данные для регистрации:', { fullName, phone, email });

        const user = new User({ fullName, phone, email, password });
        
        // Генерируем код подтверждения
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); 
        
        await user.save(); // Сначала сохраняем пользователя

        // Создаем аккаунт для пользователя без accountNumber
        const account = new Account({ userId: user._id }); 
        await account.save(); // Сохраняем аккаунт

        console.log('Аккаунт успешно создан:', account);

        // Инициализируем registrationData в сессии
        req.session.registrationData = {
            userId: user._id,
            phone: phone,
            verificationCode: verificationCode
        };

        console.log('Пользователь успешно зарегистрирован:', user);

        await sendSmsVerification(phone, verificationCode); 

        return res.redirect('/verify-phone'); 
    } catch (error) {
        req.session.formData = { fullName, phone, email };
        
        console.error('Ошибка при регистрации:', error.message);
        
        return res.redirect('/registration'); // Перенаправляем на страницу регистрации
    }
};