import mongoose from 'mongoose';

const savingsAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountNumber: { type: String, unique: true, required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'RUB' },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const SavingsAccount = mongoose.model('SavingsAccount', savingsAccountSchema);

export default SavingsAccount;