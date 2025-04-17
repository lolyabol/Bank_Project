import { Router } from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import * as bankController from '../controllers/bankController.js';
import { getHomePage } from '../controllers/homeController.js'; // Импортируем контроллер для home

const router = Router();

router.get('/', bankController.getMainPage); // Главная страница
router.get('/home', getHomePage); // Страница home
router.get('/bank', isAuthenticated, (req, res, next) => {
    console.log(`Запрос на /bank от пользователя с ID: ${req.user ? req.user._id : 'не аутентифицирован'}`);
    next();
}, bankController.getBankPage);
router.post('/bank/transfer', isAuthenticated, bankController.transferFunds); // API для переводов
router.post('/bank/loan', isAuthenticated, bankController.applyForLoan); // API для кредитов

export default router;