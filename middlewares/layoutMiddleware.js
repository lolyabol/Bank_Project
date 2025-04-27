export function layoutSelector(req, res, next) {
    const authPaths = ['/', '/login', '/register', '/createAccount'];

    if (authPaths.includes(req.path)) {
        res.locals.layout = 'auth'; 
    } else {
        res.locals.layout = 'main';
    }
    next();
}