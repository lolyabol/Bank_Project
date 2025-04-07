
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

        req.session.userId = req.session.registrationData.userId;
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