import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Ожидает оплаты', 'Оплачен', 'Просрочен'], default: 'Ожидает оплаты' },
    paidAmount: Number,
    paymentDate: Date
  });
  
const loanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    amount: { 
        type: Number,
        required: true,
        min: 1000
    },
    creditedAmount: { 
        type: Number,
        required: true
    },
    interestRate: {
        type: Number,
        required: true
    },
    term: {
        type: Number,
        required: true
    },
    purpose: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    payments: [{
        date: Date,
        amount: Number, 
        status: {
            type: String,
            enum: ['Ожидает оплаты', 'Оплаченный'],
            default: 'Ожидает оплаты'
        },
        paidAmount: Number, 
        paymentDate: Date
    }],
    remainingBalance: {
        type: Number,
        required: true
    },
    monthlyPayment: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Активный', 'Оплаченный', 'Просроченный'],
        default: 'Активный'
    },
    currency: { 
        type: String,
        default: 'RUB'
    },
    exchangeRate: {
        type: Number
    },
    commission: { 
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;