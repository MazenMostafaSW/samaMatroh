
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const factory = require("./handlersFactory");
const User = require("../models/userModel");
const { uploadUserImage, resizeUserImage } = require('../middleware/uploadImageMiddleware');
const ApiError = require('../utils/apiError');
const { createToken } = require('../services/auth/tokenService');

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// Export the image upload middlewares
exports.uploadUserImage = uploadUserImage;
exports.resizeUserImage = resizeUserImage;

// Create a new user
exports.createUser = factory.createOne(User);

// Get all users
exports.getUser = factory.getAll(User);

// Get a single user by ID
exports.getUserByID = factory.getOne(User);

// Update a user by ID (excluding password fields)
exports.updateUserByID = asyncHandler(async (req, res, next) => {
    // 1) Check if request contains password fields
    if (req.body.password ) {
        return next(
            new ApiError(
                'This route is not for password updates. Please use /changePassword/:id',
                400
            )
        );
    }
    
    // 2) Filter out unwanted fields that should not be updated
    const filteredBody = filterObj(
        req.body,
        'name',
        'email',
        'phone',
        'role',
        'image'
    );
    
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );
    
    if (!updatedUser) {
        return next(new ApiError(`No user found with this id: ${req.params.id}`, 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: updatedUser
    });
});

// Toggle user active status
exports.toggleUserActiveStatus = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    
    if (!user) {
        return next(new ApiError(`No user found with this id: ${req.params.id}`, 404));
    }
    
    user.active = !user.active;
    user.deactivatedAt = user.active ? undefined : Date.now();
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
        status: 'success',
        data: user
    });
});

// Change user password 
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
    // 1) Get user by id with password field (which is normally excluded)
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
        return next(new ApiError(`No user found with this id: ${req.params.id}`, 404));
    }
    
    // 2) Check if user has a password set
    if (!user.password && req.body.currentPassword) {
        return next(new ApiError('User has no password set. You can directly set a new password.', 400));
    }
    
    // 3) If user has a password and currentPassword is provided, verify it
    if (user.password && req.body.currentPassword) {
        const isCorrectPassword = await bcrypt.compare(
            req.body.currentPassword,
            user.password
        );
        
        if (!isCorrectPassword) {
            return next(new ApiError('Current password is incorrect', 401));
        }
    }
    
    // 4) Update password
    user.password = req.body.newPassword;
    user.passwordChangedAt = Date.now();
    
    await user.save();
    
    res.status(200).json({
        status: 'success',
        message: 'Password updated successfully'
    });
});

// Get logged user data
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
    // Directly fetch the user data
    const user = await User.findById(req.user.id);
    
    if (!user) {
        return next(new ApiError('User not found', 404));
    }
    
    // Return the user data directly
    res.status(200).json({
        status: 'success',
        data: user
    });
});

// Update logged user data (for the current user)
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
    // 1) Check if request contains password fields
    if (req.body.password) {
        return next(
            new ApiError(
                'This route is not for password updates. Please use /changeMyPassword',
                400
            )
        );
    }
    
    // 2) Filter out unwanted fields that should not be updated
    const filteredBody = filterObj(
        req.body,
        'name',
        'email',
        'phone',
        'image',
        'city',
        'country',
        'birthDate',
        'gender'

    );
    
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );
    
    res.status(200).json({
        status: 'success',
        data: updatedUser
    });
});

// Update logged user password (for the current user)
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
    // 1) Get user from collection with password field
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
        return next(new ApiError('User not found', 404));
    }
    
    // 2) Check if posted current password is correct
    if (!user.password) {
        return next(new ApiError('You have no password set. Please use the reset password feature.', 400));
    }
    
    const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
    );
    
    if (!isCorrectPassword) {
        return next(new ApiError('Current password is incorrect', 401));
    }
    // Password changed after token created(error)
    if (user.changedPasswordAfter(req.user.iat)) {
        return next(new ApiError('User recently changed password! Please login again', 401));
    }
    // 3) Update password
    user.password = req.body.newPassword;
    user.passwordChangedAt = Date.now();
    
    await user.save();
    
    // 4) Generate new token since password changed
    const token = createToken(user._id);
    
    res.status(200).json({
        status: 'success',
        message: 'Password updated successfully',
        token
    });
    
});

// Delete logged user account (soft delete)
exports.deleteLoggedUserAccount = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { 
        active: false,
        deactivatedAt: Date.now()
    });
    
    res.status(204).json({
        status: 'success',
        message: 'User account deleted successfully',
        data: null
    });
});
