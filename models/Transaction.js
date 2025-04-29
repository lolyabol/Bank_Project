import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true 
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true 
    },
    amount: {
        type: Number,
        required: true
    },
    originalAmount: Number, 
    convertedAmount: Number, 
    type: {
        type: String,
        required: true,
        enum: ['Пополнение', 'Перевод отправлен', 'Перевод получен', 'Снятие']
    },
    currency: {
        type: String,
        required: true
    },
    targetCurrency: String,
    sourceCurrency: String, 
    date: {
        type: Date,
        default: Date.now
    },
    description: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;