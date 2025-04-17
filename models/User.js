import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  password: { type: String, required: true },
  email: { type: String, required: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+7\d{10}$/.test(v); 
      },
      message: props => `${props.value} не является корректным номером телефона!`
    }
  },
  fullName: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
export default User;