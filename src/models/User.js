import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true }, 
    phone: { 
        type: String, 
        required: true, 
        unique: true,
        match: /^\+7\d{10}$/ 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    },
    password: { 
        type: String, 
        required: true,
        minlength: 8,
        select: false 
    },

    isPhoneVerified: { type: Boolean, default: false }, 
    isEmailVerified: { type: Boolean, default: false }, 
    failedLoginAttempts: { type: Number, default: 0 }, 
    accountLockedUntil: { type: Date }, 
    lastLogin: { type: Date }, 
    accountStatus: { 
        type: String, 
        enum: ['pending', 'active', 'suspended', 'closed'], 
        default: 'pending' 
    },

    dateOfBirth: { type: Date },
    marketingConsent: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }, 

    ipAddress: { type: String }, 
    deviceInfo: { type: String }, 
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;