const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    receiver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    image: String,
}, 
{ 
    timestamps: true 
});

// Create model
const transactionModel = mongoose.model('Transaction', transactionSchema);

module.exports =  transactionModel;
