const mongoose = require('mongoose');
const User = require('./userModel');

const reservationsSchema = new mongoose.Schema(
    {

        client: {
            type: String,
            required: [true, 'client is required'],
        },
        regiment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Regiments',
            required: [true, 'regiment is required'],
        },
        busSeats: {
            type:[mongoose.Schema.Types.ObjectId],
            ref: 'BusSeats',
            required: [true, 'busSeats is required'],
        },
        deposit:{
            type: Number
        },
        remainingMony1:{
            type: Number
        },
        remainingMony2:{
            type: Number
        },
        remainingMony3:{
            type: Number
        },
        remainingMony4:{
            type: Number
        },
        notes:{
            type: String
        }
    },
    {
        timestamps: true
    }
);
// Create model
const reservationsModel = mongoose.model('Reservations', reservationsSchema);

// Pre-save middleware to update user balance
reservationsSchema.pre('save', async function(next) {
    if (this.isNew) {
        // New reservation - deduct from user balance
        const totalAmount = (this.deposit || 0) + 
                           (this.remainingMony1 || 0) + 
                           (this.remainingMony2 || 0) + 
                           (this.remainingMony3 || 0) + 
                           (this.remainingMony4 || 0);
        
        if (totalAmount > 0) {
            await User.findByIdAndUpdate(
                this.client,
                { $inc: { balance: -totalAmount } }
            );
        }
    } else {
        // Existing reservation - calculate difference
        const oldTotal = (this._original?.deposit || 0) + 
                        (this._original?.remainingMony1 || 0) + 
                        (this._original?.remainingMony2 || 0) + 
                        (this._original?.remainingMony3 || 0) + 
                        (this._original?.remainingMony4 || 0);
        
        const newTotal = (this.deposit || 0) + 
                        (this.remainingMony1 || 0) + 
                        (this.remainingMony2 || 0) + 
                        (this.remainingMony3 || 0) + 
                        (this.remainingMony4 || 0);
        
        const difference = newTotal - oldTotal;
        
        if (difference !== 0) {
            await User.findByIdAndUpdate(
                this.client,
                { $inc: { balance: -difference } }
            );
        }
    }
    next();
});

// Pre-findOneAndUpdate to store original values
reservationsSchema.pre('findOneAndUpdate', async function(next) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        this._original = docToUpdate.toObject();
    }
    next();
});

module.exports = reservationsModel;
