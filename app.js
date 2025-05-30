import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './db.js';
import mainRoutes from './routes/mainRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';
import { layoutSelector } from './middlewares/layoutMiddleware.js';
import userRoutes from './routes/userRoutes.js';
import { attachUserData } from './middlewares/userDataMiddleware.js';
import path from 'path';
import Handlebars from 'handlebars'; 
import flash from 'connect-flash';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

const hbs = engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(__dirname, 'views/layouts/'),
    partialsDir: join(__dirname, 'views/partials/'),
    helpers: {
        formatDate: (date) => new Date(date).toLocaleDateString()
    }
});

Handlebars.registerHelper('calcProgress', function(total, remaining) {
    const paid = total - remaining;
    return ((paid / total) * 100).toFixed(2);
  });

Handlebars.registerHelper('calcPaid', function(total, remaining) {
    const paid = total - remaining;
    return ((paid / total) * 100).toFixed(2);
  });  

Handlebars.registerHelper('inc', function(value) {
    return parseInt(value) + 1;
  });

Handlebars.registerHelper('gt', function (a, b) {
    return a > b;
});

Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

Handlebars.registerHelper('formatCurrency', function(amount) {
    return parseFloat(amount).toFixed(2);
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
app.use(attachUserData);
app.use(cookieParser());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));

app.set('socketio', io);

app.use(flash());

app.use('/', authRoutes);
app.use('/main', mainRoutes);
app.use('/user', userRoutes);

io.on('connection', (socket) => {
    socket.on('join-user-room', (userId) => {
        socket.join(`user_${userId}`);
    });
});

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Сервер запущен на http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Ошибка запуска сервера:', err);
        process.exit(1);
    }
};

startServer();

export default app;