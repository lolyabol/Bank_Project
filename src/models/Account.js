import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true // Убедитесь, что это нужно
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true
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

// Генерация номера счета перед сохранением
accountSchema.pre('save', async function(next) {
    if (!this.accountNumber) {
        let isUnique = false;
        while (!isUnique) {
            this.accountNumber = '40702' + 
                Math.random().toString().slice(2, 8) + 
                Math.random().toString().slice(2, 6);
            const existingAccount = await Account.findOne({ accountNumber: this.accountNumber });
            isUnique = !existingAccount; // Проверяем уникальность
        }
    }
    next();
});

const Account = mongoose.model('Account', accountSchema);
export default Account;