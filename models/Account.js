import mongoose from 'mongoose';

// Определение схемы аккаунта
const accountSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^40702\d{6}$/.test(v); // Проверка на формат 40702XXXXXX
            },
            message: props => `${props.value} не является корректным номером счета!`
        }
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        default: 'RUB'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'frozen', 'closed'],
        default: 'active'
    }
});

// Объявляем модель Account
const Account = mongoose.model('Account', accountSchema);
export default Account;