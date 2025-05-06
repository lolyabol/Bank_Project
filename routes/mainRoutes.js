import express from 'express';
import { getHome, getAccountBalance } from '../controllers/homeController.js';
import { createTransaction, getTransactionsPage } from '../controllers/transactionController.js';
import { getAccountsPage, changeAccount } from '../controllers/accountController.js';
import { getDepositPage, postDeposit } from '../controllers/depositController.js';
import { getTransferPage, getAccountInfo, getExchangeRateHandler, transferByPhone } from '../controllers/transferController.js'; 
import { getSavingsAccountPage, showCreateForm, createSavingsAccount, depositToSavingsAccount } from '../controllers/savingsAccountController.js';
import { showLoanForm, createLoan, makePayment, loansPage } from '../controllers/loanController.js';
import userRoutes from './userRoutes.js';

import authenticateToken from '../middlewares/authMiddleware.js';
import { attachUserData } from '../middlewares/userDataMiddleware.js'; 

const router = express.Router();

router.use(authenticateToken);
router.use(attachUserData); 

router.get('/home', getHome);
router.post('/change-account/:accountId', changeAccount);
router.get('/account-balance/:accountId', getAccountBalance);
router.get('/account', getAccountsPage);
router.get('/deposit', getDepositPage);
router.post('/deposit', postDeposit); 
router.get('/transfer', getTransferPage);
router.get('/account-info', getAccountInfo);
router.get('/exchange-rate', getExchangeRateHandler);
router.get('/saving-account/create', showCreateForm);
router.get('/saving-account', getSavingsAccountPage);
router.post('/saving-account/create', createSavingsAccount);
router.post('/saving-account/deposit', depositToSavingsAccount);
router.post('/transfer-by-phone', transferByPhone);
router.get('/transactions', getTransactionsPage);
router.post('/transaction', createTransaction);
router.get('/loans/new', showLoanForm);
router.post('/loans', createLoan);
router.get('/loans', loansPage);
router.post('/loans/:loanId/payment', makePayment);

router.use('/user', userRoutes);

export default router;