import User from '../models/User.js';

export const attachUserData = async (req, res, next) => {
    try {
        if (req.user?.id) { 
            const user = await User.findById(req.user.id);
            
            if (user) {
                res.locals.user = {
                    id: user._id.toString(),
                    name: user.fullName,
                    avatarUrl: user.avatarUrl || '/images/default-avatar.png'
                };
                req.user = { ...req.user, ...res.locals.user };
            }
        }
        next();
    } catch (error) {
        console.error('Ошибка в attachUserData:', error);
        next();
    }
};