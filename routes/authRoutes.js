import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { accountCreated, createAccountPost, createAccount } from '../controllers/accountController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('register'); 
});

router.post('/register', registerUser);

router.get('/createAccount', createAccount);

router.post('/createAccount', createAccountPost); 

router.get('/accountCreated', accountCreated);

router.get('/login', (req, res) => {
    res.render('login'); 
});

router.post('/login', loginUser); 

router.get('/logout', logoutUser); 

export default router;