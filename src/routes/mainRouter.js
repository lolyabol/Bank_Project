import { Router } from 'express';
import { HomePage } from '../controllers/homeController.js';
import { AboutPage } from '../controllers/aboutController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js'; 
import User from '../models/User.js';

const router = Router();
router.get('/main', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.user._id);
    console.log(user);
    res.render('main', { user });
});
router.get('/', isAuthenticated, HomePage); 
router.get('/about', isAuthenticated, AboutPage);

router.get('/home', isAuthenticated, HomePage);

router.use((req, res) => {
    res.status(404).send('Страница не найдена');
});

export default router;
