import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  interestRate: {
    type: Number,
    required: true,
    min: 1,
    max: 30 
  },
  term: { 
    type: Number,
    required: true,
    min: 1,
    max: 3 
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'overdue', 'default'],
    default: 'active'
  },
  monthlyPayment: {
    type: Number,
    required: true
  },
  payments: [{
    date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'missed'],
      default: 'pending'
    }
  }],
  remainingBalance: {
    type: Number,
    required: true
  }
});

loanSchema.methods.calculateMonthlyPayment = function() {
  const monthlyRate = this.interestRate / 100 / 12;
  return this.amount * 
         (monthlyRate * Math.pow(1 + monthlyRate, this.term)) / 
         (Math.pow(1 + monthlyRate, this.term) - 1);
};

loanSchema.pre('save', function(next) {
  if (this.isNew) {
    this.monthlyPayment = this.calculateMonthlyPayment();
    this.remainingBalance = this.amount;
    
    const payments = [];
    let balance = this.amount;
    const paymentDate = new Date(this.startDate);
    
    for (let i = 0; i < this.term; i++) {
      paymentDate.setMonth(paymentDate.getMonth() + 1);
      const interest = balance * (this.interestRate / 100 / 12);
      const principal = this.monthlyPayment - interest;
      balance -= principal;
      
      payments.push({
        date: new Date(paymentDate),
        amount: this.monthlyPayment,
        status: 'pending'
      });
    }
    
    this.payments = payments;
    this.endDate = new Date(paymentDate);
  }
  next();
});

export default mongoose.model('Loan', loanSchema);