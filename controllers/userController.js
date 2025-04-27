import User from '../models/User.js';
import Account from '../models/Account.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const account = await Account.findOne({ userId }).populate('userId').lean();

        if (!account) {
            return res.status(404).json({ message: 'Аккаунт не найден' });
        }

        res.render('account', { 
            account,
            formatDate: (date) => new Date(date).toLocaleDateString()
        });
    } catch (error) {
        console.error('Ошибка при получении профиля пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении профиля', error });
    }
};

export const updateUserAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Файл не загружен' });
        }

        const userId = req.user.id;
        const tempFilePath = req.file.path;
        const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

        if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir, { recursive: true });
        }

        const user = await User.findById(userId);
        if (user.avatarUrl && !user.avatarUrl.includes('default-avatar')) {
            const oldAvatarPath = path.join(process.cwd(), 'public', user.avatarUrl);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        const fileExt = path.extname(req.file.originalname);
        const newFileName = `avatar-${userId}-${Date.now()}${fileExt}`;
        const newPath = path.join(avatarsDir, newFileName);

        await fs.promises.rename(tempFilePath, newPath);

        const avatarUrl = `/uploads/avatars/${newFileName}`;
        await User.findByIdAndUpdate(userId, { avatarUrl });

        const io = req.app.get('socketio');
        io.to(`user_${userId}`).emit('avatar-updated', { avatarUrl });

        res.json({ 
            success: true, 
            avatarUrl, 
            message: 'Аватар успешно обновлен' 
        });

    } catch (error) {
        console.error('Ошибка при обновлении аватара:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка при обновлении аватара',
            error: error.message 
        });
    }
};


export const updateUserEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Этот email уже используется другим пользователем' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: 'Email успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении email:', error);
    res.status(500).json({ message: 'Ошибка при обновлении email', error });
  }
};

export const updateUserPhone = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Этот телефон уже используется другим пользователем' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { phone },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: 'Телефон успешно обновлен' });
  } catch (error) {
    console.error('Ошибка при обновлении телефона:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Некорректный формат телефона' });
    }
    
    res.status(500).json({ message: 'Ошибка при обновлении телефона', error });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Текущий пароль неверен' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
    res.status(500).json({ message: 'Ошибка при обновлении пароля', error });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndDelete(userId);
    
    req.session.destroy();
    
    res.json({ message: 'Аккаунт успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении аккаунта:', error);
    res.status(500).json({ message: 'Ошибка при удалении аккаунта', error });
  }
};