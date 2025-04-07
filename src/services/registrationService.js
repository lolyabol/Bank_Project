import User from '../models/User.js'; // Импортируем только модель User
import { hashPassword } from '../services/passwordService.js';

export const registerBankUser = async (fullName, phone, email, password, agreeMarketing) => {
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }

        // Хеширование пароля
        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            fullName,
            phone,
            email,
            password: hashedPassword,
            agreeMarketing,
        });

        await newUser.save();
        return newUser;
    } catch (error) {
        throw error;
    }
};
