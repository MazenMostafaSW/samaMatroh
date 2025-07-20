const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Reservations = require('../models/reservationsModel');
const ApiError = require('../utils/apiError');

// Calculate total amount from reservation money fields
const calculateTotalAmount = (reservation) => {
    return (reservation.deposit || 0) + 
           (reservation.remainingMony1 || 0) + 
           (reservation.remainingMony2 || 0) + 
           (reservation.remainingMony3 || 0) + 
           (reservation.remainingMony4 || 0);
};

// Update user balance when creating reservation
exports.createReservationWithBalance = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const totalAmount = calculateTotalAmount(req.body);
            
            if (totalAmount > 0) {
                // Check user balance
                const user = await User.findById(req.body.client).session(session);
                if (!user) {
                    throw new ApiError('User not found', 404);
                }
                
                if (user.balance < totalAmount) {
                    throw new ApiError('Insufficient balance', 400);
                }
                
                // Update user balance
                user.balance -= totalAmount;
                await user.save({ session });
            }
            
            // Create reservation
            const reservation = await Reservations.create([req.body], { session });
            
            res.status(201).json({
                status: 'success',
                data: reservation[0]
            });
        });
    } catch (error) {
        return next(error);
    } finally {
        await session.endSession();
    }
});

// Update reservation and adjust user balance
exports.updateReservationWithBalance = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            // Get original reservation
            const originalReservation = await Reservations.findById(req.params.id).session(session);
            if (!originalReservation) {
                throw new ApiError('Reservation not found', 404);
            }
            
            const oldTotal = calculateTotalAmount(originalReservation);
            const newTotal = calculateTotalAmount(req.body);
            const difference = newTotal - oldTotal;
            
            if (difference !== 0) {
                // Get user
                const user = await User.findById(originalReservation.client).session(session);
                if (!user) {
                    throw new ApiError('User not found', 404);
                }
                
                // Check balance if increasing amount
                if (difference > 0 && user.balance < difference) {
                    throw new ApiError('Insufficient balance for the increase', 400);
                }
                
                // Update user balance
                user.balance -= difference;
                await user.save({ session });
            }
            
            // Update reservation
            const updatedReservation = await Reservations.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, session }
            );
            
            res.status(200).json({
                status: 'success',
                data: updatedReservation
            });
        });
    } catch (error) {
        return next(error);
    } finally {
        await session.endSession();
    }
});

// Delete reservation and refund user balance
exports.deleteReservationWithRefund = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            // Get reservation
            const reservation = await Reservations.findById(req.params.id).session(session);
            if (!reservation) {
                throw new ApiError('Reservation not found', 404);
            }
            
            const totalAmount = calculateTotalAmount(reservation);
            
            if (totalAmount > 0) {
                // Refund user balance
                const user = await User.findById(reservation.client).session(session);
                if (user) {
                    user.balance += totalAmount;
                    await user.save({ session });
                }
            }
            
            // Delete reservation
            await Reservations.findByIdAndDelete(req.params.id, { session });
            
            res.status(200).json({
                status: 'success',
                message: 'Reservation deleted and balance refunded'
            });
        });
    } catch (error) {
        return next(error);
    } finally {
        await session.endSession();
    }
});

// Get user's current balance
exports.getUserBalance = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('balance');
    
    if (!user) {
        return next(new ApiError('User not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            balance: user.balance
        }
    });
});