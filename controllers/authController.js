import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  const { username, password, email, phone, fullName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким адресом электронной почты уже существует.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email, phone, fullName });
    await newUser.save();

    req.session.userId = newUser._id;

    res.redirect('/createAccount'); 
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка при регистрации', error });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) return res.status(401).json({ message: 'Неверный пароль' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    res.cookie('token', token);

    req.session.userId = user._id;

    res.redirect('/main/home');
  } catch (error) {
    console.error('Ошибка при входе:', error); 
    res.status(500).json({ message: 'Ошибка при входе', error });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie('token');
  req.session.destroy(err => {
      if (err) {
          console.error('Ошибка при выходе:', err);
          return res.status(500).send('Ошибка при выходе');
      }
      res.redirect('/login');
  });
};