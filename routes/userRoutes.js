import express from 'express';
import { 
  getUserProfile,
  updateUserAvatar,
  updateUserEmail,
  updateUserPhone,
  updateUserPassword,
  deleteUserAccount
} from '../controllers/userController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getUserProfile);
router.post('/update-avatar', upload.single('avatar'), updateUserAvatar);
router.post('/update-email', updateUserEmail);
router.post('/update-phone', updateUserPhone);
router.post('/update-password', updateUserPassword);
router.delete('/delete-account', deleteUserAccount);

export default router;