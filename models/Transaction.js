import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Необходимо указать пользователя']
    },
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: function() {
            return !['deposit', 'loan_approval'].includes(this.type);
        }
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Необходимо указать сумму'],
        min: [0.01, 'Сумма должна быть не менее 0.01']
    },
    convertedAmount: {
        type: Number,
        default: function() {
            return this.amount;
        }
    },
    type: {
        type: String,
        required: true,
        enum: [
            'deposit', 
            'withdrawal', 
            'transfer', 
            'payment', 
            'loan_approval', 
            'loan_payment',
            'savings_deposit',
            'savings_withdrawal'
        ],
        default: 'transfer'
    },
    currency: {
        type: String,
        required: [true, 'Необходимо указать валюту']
    },
    targetCurrency: {
        type: String,
        default: function() {
            return this.currency;
        }
    },
    exchangeRate: {
        type: Number,
        default: 1
    },
    commission: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

transactionSchema.index({ userId: 1 });
transactionSchema.index({ fromAccount: 1 });
transactionSchema.index({ toAccount: 1 });
transactionSchema.index({ date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;