import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: false
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^40702\d{6}$/.test(v);
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
    },
    isMain: {  
        type: Boolean,
        default: false
    }
});

const Account = mongoose.model('Account', accountSchema);
export default Account;