const mongoose = require('mongoose');

const apartmentsSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: [true, 'number is required'],
            unique: [true, 'number must be unique'],
        },
        tower: {
            type: String,
            required: [true, 'tower is required'],
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
    },
);
// Create model
const apartmentsModel = mongoose.model('Apartments', apartmentsSchema);

module.exports = apartmentsModel;