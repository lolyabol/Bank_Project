import { registerBankUser } from '../services/registrationService.js';
import { sendSmsVerification } from '../services/smsService.js';

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
    const { fullName, phone, email, password, agreeMarketing } = req.body;

    try {
        console.log('Получены данные для регистрации:', { fullName, phone, email });

        const user = await registerBankUser(fullName, phone, email, password, agreeMarketing);

        req.session.registrationData = {
            userId: user._id,
            phone: phone,
            email: email,
        };

        await sendSmsVerification(phone, req.session);

        console.log('Перенаправляем на страницу верификации телефона');
        
        return res.redirect('/verify-phone');
    } catch (error) {
        req.session.formData = { fullName, phone, email };
        req.session.error = error.message;
        
        console.error('Ошибка при регистрации:', error.message);
        
        return res.redirect('/');
    }
};