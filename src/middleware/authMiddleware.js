import User from '../models/User.js'; 

export const isAuthenticated = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId); 
            if (user) {
                req.user = user; 
                return next();
            }
        } catch (error) {
            console.error('Ошибка при получении пользователя:', error);
            return res.status(500).send('Ошибка сервера');
        }
    }
    res.redirect('/login');
};