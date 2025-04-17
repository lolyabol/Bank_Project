export function layoutSelector(req, res, next) {
    const authPaths = ['/', '/login', '/register'];

    if (authPaths.includes(req.path)) {
        res.locals.layout = 'auth'; // используем layouts/auth.hbs
    } else {
        res.locals.layout = 'main';
    }
    next();
}