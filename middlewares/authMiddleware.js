import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        console.log('Токен отсутствует');
        return res.redirect('/login'); 
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Ошибка проверки токена:', err);
            return res.sendStatus(403); 
        }

        req.user = user; 
        next();
    });
};
export default authenticateToken;