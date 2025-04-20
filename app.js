import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import connectDB from './db.js';
import mainRoutes from './routes/mainRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';
import { layoutSelector } from './middlewares/layoutMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hbs = engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(__dirname, 'views/layouts/'),
    partialsDir: join(__dirname, 'views/partials/'),
    helpers: {
        formatDate: (date) => {
            return new Date(date).toLocaleDateString(); 
        }
    }
});
app.use(layoutSelector);
app.engine('hbs', hbs);
app.set('view engine', 'hbs');
app.set('views', join(__dirname, 'views'));

app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(cookieParser());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/', authRoutes);
app.use('/main', mainRoutes);

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