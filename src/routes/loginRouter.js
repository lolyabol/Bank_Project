import express from 'express';
import { LoginPage, handleLogin } from '../controllers/loginController.js';

const router = express.Router();

router.get('/', LoginPage);
router.post('/', handleLogin);


export default router;