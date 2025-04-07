import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import connectDB from './src/db.js';
import registrationRouter from './src/routes/registrationRouter.js';
import loginRouter from './src/routes/loginRouter.js';
import mainRouter from './src/routes/mainRouter.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(__dirname, 'src/views/layouts/'),
    partialsDir: join(__dirname, 'src/views/partials/'),
}));
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'src/views'));

app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/', registrationRouter);
app.use('/login', loginRouter);
app.use('/main', mainRouter);

app.use((req, res) => {
    res.status(404).render('404', { title: 'Страница не найдена' });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Сервер запущен на http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Ошибка запуска сервера:', err);
        process.exit(1);
    }
};

startServer();

export default app;