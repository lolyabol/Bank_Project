import User from '../models/User.js';
import path from 'path';

export const attachUserData = async (req, res, next) => {
    try {
        console.log('Session:', req.session);
        console.log('Session userId:', req.session.userId);
        
        if (req.session.userId) {
            console.log('Finding user with ID:', req.session.userId);
            const user = await User.findById(req.session.userId);
            console.log('Found user:', user);
            
            if (user) {
                res.locals.user = {
                    id: user._id.toString(),
                    name: user.fullName,
                    avatarUrl: user.avatarUrl || '/images/default-avatar.png'
                };
                console.log('Attached user data:', res.locals.user);
            }
        }
        next();
    } catch (error) {
        console.error('Error attaching user data:', error);
        next();
    }
};