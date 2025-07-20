const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const ApiError = require('../utils/apiError');
const { getAll, getOne } = require('./handlersFactory');

// Send money to another user
exports.sendMoney = asyncHandler(async (req, res, next) => {
    const { receiverId, amount, description } = req.body;
    const senderId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
        return next(new ApiError('Amount must be greater than 0', 400));
    }

    // Check if sender and receiver are different
    if (senderId === receiverId) {
        return next(new ApiError('Cannot send money to yourself', 400));
    }

    // Start transaction session
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            // Find sender and receiver
            const sender = await User.findById(senderId).session(session);
            const receiver = await User.findById(receiverId).session(session);

            if (!receiver) {
                throw new ApiError('Receiver not found', 404);
            }

            // Check sender balance
            if (sender.balance < amount) {
                throw new ApiError('Insufficient balance', 400);
            }

            // Update balances
            sender.balance -= amount;
            receiver.balance += amount;

            // Save users
            await sender.save({ session });
            await receiver.save({ session });

            // Create transaction record
            await Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                amount,
                description
            }], { session });
        });

        res.status(200).json({
            status: 'success',
            message: 'Money sent successfully'
        });

    } catch (error) {
        return next(error);
    } finally {
        await session.endSession();
    }
});

// Get user transactions
exports.getUserTransactions = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    const transactions = await Transaction.find({
        $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: transactions.length,
        data: transactions
    });
});

//get all transactions for admin
exports.getAllTransactions = getAll(Transaction);

//get one transaction for admin
exports.getTransaction = getOne(Transaction);


//delet transaction for admin and return money to sender and receiver and delete transaction record and update balance for sender and receiver
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
    
    const transactionId = req.params.id;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        return next(new ApiError('Transaction not found', 404));
    }

    // Start transaction session
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            // Find sender and receiver
            const sender = await User.findById(transaction.sender).session(session);
            const receiver = await User.findById(transaction.receiver).session(session);

            // Update balances
            sender.balance += transaction.amount;
            receiver.balance -= transaction.amount;

            // Save users
            await sender.save({ session });
            await receiver.save({ session });

            // Delete transaction record
            await Transaction.findByIdAndDelete(transactionId, { session });
        });

        res.status(200).json({
            status: 'success',
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        return next(error);
    } finally {
        await session.endSession();
    }
});