import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Регистрация пользователя
export const registerUser = async (req, res) => {
  const { username, password, email, phone, fullName } = req.body;

  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким адресом электронной почты уже существует.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email, phone, fullName });
    await newUser.save();

    // Перенаправляем на страницу создания аккаунта
    res.redirect(`/create-account?userId=${newUser._id}`);
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка при регистрации', error });
  }
};

// Вход пользователя
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) return res.status(401).json({ message: 'Неверный пароль' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    res.cookie('token', token);
    
    // Перенаправляем на главную страницу после успешного входа
    res.redirect('/main/home'); // Измените на нужный маршрут для главной страницы
  } catch (error) {
    console.error('Ошибка при входе:', error); // Логируем ошибку
    res.status(500).json({ message: 'Ошибка при входе', error });
  }
};

// Выход пользователя
export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};