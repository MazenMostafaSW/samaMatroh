const mongoose = require('mongoose');

const busSeatsSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: [true, 'number is required'],
            unique: [true, 'number must be unique'],
        },
        active: {
            type: Boolean,
            default: true
        },
        reservations: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Reservations',
            default: []
        }
        
    },
    {
        timestamps: true
    }
);
// Create model
const busSeatsModel = mongoose.model('BusSeats', busSeatsSchema);

module.exports = busSeatsModel;