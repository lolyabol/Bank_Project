import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { accountCreated } from '../controllers/accountController.js';
import { createAccount } from '../controllers/accountController.js'

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register'); // Отключаем лейаут
});
router.post('/register', registerUser);
router.get('/create-account', createAccount); // Новый маршрут для создания аккаунта

router.get('/account-created', accountCreated);

router.get('/login', (req, res) => {
    res.render('login'); // Отключаем лейаут
});

router.post('/login', loginUser); // Обработка входа.

router.get('/logout', logoutUser); // Выход пользователя.

export default router;