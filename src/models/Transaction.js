import mongoose from 'mongoose';

// Определяем схему транзакции
const transactionSchema = new mongoose.Schema({
    account: { 
        type: mongoose.Schema.Types.ObjectId, // Ссылка на модель Account
        ref: 'Account', 
        required: true 
    },
    amount: { 
        type: Number, // Сумма транзакции
        required: true 
    },
    type: { // Тип транзакции (например, 'credit' или 'debit')
        type: String,
        enum: ['credit', 'debit'], // Ограничиваем возможные значения
        required: true
    },
    description: {
        type: String,
        default: '' // Описание транзакции (по умолчанию пустая строка)
    },
    createdAt: {
        type: Date,
        default: Date.now // Дата создания транзакции (по умолчанию текущее время)
    }
});

// Создаем модель на основе схемы
const Transaction = mongoose.model('Transaction', transactionSchema);

// Экспортируем модель для использования в других частях приложения
export default Transaction;