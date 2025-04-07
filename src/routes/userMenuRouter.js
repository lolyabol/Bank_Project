import { Router } from 'express';
import { addDishToMenu, getUserMenu } from '../controllers/userController.js';
import { removeDishFromMenu, getDishById } from '../controllers/userController.js';

const router = Router();

router.post('/addMenu', addDishToMenu); 
router.delete('/removeDish/:id', removeDishFromMenu);
router.get('/getMenu', getUserMenu);
router.get('/getDish/:dishId', getDishById); 

export default router;