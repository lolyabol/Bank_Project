import { connect } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Инициализируем dotenv

const connectDB = async () => {
    try {
        await connect(process.env.MONGODB_URI);
        console.log('MongoDB подключен');
    } catch (error) {
        console.error('Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;
