import express from 'express';

import { getHome } from '../controllers/homeController.js';
import {
  createTransaction,
  getTransactionsPage
} from '../controllers/transactionController.js';
import { getLoansPage } from '../controllers/loansController.js';
import {
  getAccountsPage,
  depositToAccount,
  transferBetweenAccounts,
} from '../controllers/accountController.js';
import {
  getDepositPage
} from '../controllers/depositController.js';
import { getTransferPage } from '../controllers/transferController.js'; 

import {
  getSavingsAccountPage,
  showCreateForm,
  createSavingsAccount
} from '../controllers/savingsAccountController.js';

import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Главная страница банка
router.get('/home', getHome);

// Страница мониторинга счета
router.get('/account', getAccountsPage);

// Страница пополнения счета
router.get('/deposit', getDepositPage);

// Страница перевода средств
router.get('/transfer', getTransferPage);

// Форма создания сберегательного счета (новый маршрут)
router.get('/savings-account/create', showCreateForm);

// Просмотр сберегательного счета
router.get('/savings-account', getSavingsAccountPage);

// Создание сберегательного счета (обработка формы)
router.post('/savings-account/create', createSavingsAccount);

router.post('/deposit', depositToAccount);

// Перевод между счетами
router.post('/transfer', transferBetweenAccounts);

// Страница операций со счетом
router.get('/transactions', getTransactionsPage);

// Страница кредитов
router.get('/loans', getLoansPage);

// Обработка транзакций (создание)
router.post('/transaction', createTransaction);

export default router;