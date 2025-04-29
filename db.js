import { connect } from 'mongoose';
import dotenv from 'dotenv';
import Account from './models/Account.js';

dotenv.config(); 

const connectDB = async () => {
    try {
        await connect(process.env.MONGODB_URI);
        await Account.collection.dropIndex("userId_1").catch(() => {});
        console.log('MongoDB подключен');
    } catch (error) {
        console.error('Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;
