import User from '../models/User.js'; 
import jwt from 'jsonwebtoken';

const authenticateToken = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
            .select('_id email fullName phone')
            .lean();
        
        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            phone: user.phone 
        };
        
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

export default authenticateToken;