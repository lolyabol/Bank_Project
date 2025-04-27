import User from '../models/User.js';

export const attachUserData = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user) {
                res.locals.user = {
                    id: user._id.toString(),
                    name: user.fullName,
                    avatarUrl: user.avatarUrl || '/images/default-avatar.png'
                };
            }
        }
        next();
    } catch (error) {
        console.error('Error attaching user data:', error);
        next();
    }
};