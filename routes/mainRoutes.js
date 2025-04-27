import express from 'express';

import { getHome } from '../controllers/homeController.js';
import { createTransaction, getTransactionsPage } from '../controllers/transactionController.js';
import { getAccountsPage, depositToAccount, transferBetweenAccounts } from '../controllers/accountController.js';
import { getDepositPage } from '../controllers/depositController.js';
import { getTransferPage } from '../controllers/transferController.js'; 
import { getSavingsAccountPage, showCreateForm, createSavingsAccount, depositToSavingsAccount } from '../controllers/savingsAccountController.js';
import { showLoanForm, createLoan, makePayment, loansPage } from '../controllers/loanController.js';
import userRoutes from './userRoutes.js';

import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/home', getHome);

router.get('/account', getAccountsPage);

router.get('/deposit', getDepositPage);

router.get('/transfer', getTransferPage);

router.get('/saving-account/create', showCreateForm);

router.get('/saving-account', getSavingsAccountPage);

router.post('/saving-account/create', createSavingsAccount);

router.post('/saving-account/deposit', depositToSavingsAccount);

router.post('/deposit', depositToAccount);

router.post('/transfer', transferBetweenAccounts);

router.get('/transactions', getTransactionsPage);

router.post('/transaction', createTransaction);

router.get('/loans/new', showLoanForm);

router.post('/loans', createLoan);

router.get('/loans', loansPage);

router.post('/loans/:loanId/payment', makePayment);

router.use('/user', userRoutes);
export default router;