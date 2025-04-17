export const getHomePage = (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Если пользователь не авторизован, перенаправляем на страницу логина
    }

    res.render('home', { title: 'Добро пожаловать', user: req.session.email });
};