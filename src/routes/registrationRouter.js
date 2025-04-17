import express from 'express';
import { RegistrationPage, registerUser } from '../controllers/registrationController.js';
import { VerifyPhonePage, verifyPhoneController } from '../controllers/verifyPhoneController.js';
import { addAccountNumber } from '../controllers/accountController.js'

const router = express.Router();

router.get('/', RegistrationPage);
router.post('/registration', registerUser);

router.get('/verify-phone', VerifyPhonePage);
router.post('/verify-phone', verifyPhoneController);

router.post('/add-account-number', addAccountNumber);

router.get('/registration-success', (req, res) => {
    res.render('registration-success', { 
        title: 'Регистрация завершена' 
    });
});

export default router;