import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Ожидает оплаты', 'Оплаченный'], default: 'Ожидает оплаты' }
});

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  term: { type: Number, required: true }, // В месяцах
  purpose: { type: String },
  startDate: { type: Date, default: Date.now },
  payments: [paymentSchema],
  remainingBalance: { type: Number, default: 0 },
  monthlyPayment: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'paid'], default: 'active' }
});

export default mongoose.model('Loan', loanSchema);