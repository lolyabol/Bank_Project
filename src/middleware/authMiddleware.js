import User from '../models/User.js'; // Убедитесь, что путь к файлу правильный

export const isAuthenticated = async (req, res, next) => {
    console.log('Session userId:', req.session.userId); // Логируем userId сессии
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user; // Устанавливаем пользователя в req.user
                return next();
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send('Ошибка сервера');
        }
    }
    
    return res.redirect('/login'); // Перенаправляем на страницу входа если не аутентифицирован
};