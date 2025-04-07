import { connect } from 'mongoose';

const connectDB = async () => {
    try {
        await connect('mongodb+srv://vturilasy:1f3t48y2@bankdb.wvlioa3.mongodb.net/', {

        });
        console.log('MongoDB подключен');
    } catch (error) {
        console.error('Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;