import mongoose from 'mongoose';
import Account from './Account.js';
import Transaction from './Transaction.js';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  password: { type: String, required: true },
  email: { 
    type: String, 
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} не является корректным email!`
    }
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\+7\d{10}$/.test(v); 
      },
      message: props => `${props.value} не является корректным номером телефона!`
    }
  },
  fullName: { type: String, required: true },
  avatarUrl: { 
    type: String,
    default: '/images/default-avatar.jpg' 
  }
});

userSchema.pre('remove', async function(next) {
  try {
    await Account.deleteMany({ userId: this._id });
    await Transaction.deleteMany({ userId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
export default User;