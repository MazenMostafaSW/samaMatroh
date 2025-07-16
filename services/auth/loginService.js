const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../../models/userModel');
const ApiError = require('../../utils/apiError');
const { createToken } = require('./tokenService');

// login user
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new ApiError('Please provide email and password!', 400));
    }

    // 2) Check if user exists
    const userExists = await User.findOne({ email }).select('+password');
    if (!userExists) {
        return next(new ApiError('Invalid email or password', 401));
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, userExists.password);
    if (!isPasswordCorrect) {
        return next(new ApiError('Invalid email or password', 401));
    }

    // 3) Create token
    const token = createToken(userExists._id);

    // 4) Send response
    res.status(200).json({
        status: 'success',
        data: userExists,
        token
    });

});

