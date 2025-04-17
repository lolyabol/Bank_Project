import User from '../models/User.js'; // Импортируйте модель User
import Account from '../models/Account.js'; // Импортируйте модель Account

export const VerifyPhonePage = (req, res) => {
    if (!req.session.registrationData) {
        return res.redirect('/registration');
    }
    
    res.render('verify-phone', {
        title: 'Подтверждение телефона',
        phone: req.session.registrationData.phone,
        error: null 
    });
};

export const verifyPhoneController = async (req, res) => {
    try {
        if (!req.session.registrationData) {
            throw new Error('Сессия истекла');
        }

        const { verificationCode } = req.body; 

        if (verificationCode !== req.session.registrationData.verificationCode) {
            throw new Error('Неверный код подтверждения');
        }

        // Получаем userId из session
        const userId = req.session.registrationData.userId;

        // Находим пользователя по userId
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем пользователя с новым полем accountId
        user.isPhoneVerified = true; // Устанавливаем флаг проверки телефона
        await user.save();

        console.log('Пользователь обновлен с ID аккаунта:', user);

        // Удаляем registrationData из сессии
        delete req.session.registrationData;

        return res.redirect('/registration-success');
    } catch (error) {
        return res.render('verify-phone', {
            title: 'Подтверждение телефона',
            phone: req.session.registrationData?.phone,
            error: error.message
        });
    }
};