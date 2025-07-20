const mongoose = require('mongoose');
const reservationsModel = require('./reservationsModel');

const regimentsSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: [true, 'number is required'],
            unique: [true, 'number must be unique'],
        },
        startAt: {
            type: Date,
            required: [true, 'startAt is required'],
        },
        endAt: {
            type: Date,
            required: [true, 'endAt is required'],
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