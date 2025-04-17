import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['Пополнение', 'Перевод отправлен', 'Перевод получен', 'Списание'], required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;