import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Получаем токен из куки

    if (!token) {
        console.log('Токен отсутствует');
        return res.redirect('/login'); // Перенаправляем на страницу входа
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Ошибка проверки токена:', err);
            return res.sendStatus(403); // Токен недействителен
        }

        req.user = user; // Добавляем пользователя в объект запроса
        next();
    });
};
export default authenticateToken;