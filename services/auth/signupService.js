const asyncHandler = require('express-async-handler');
const User = require('../../models/userModel');
const ApiError = require('../../utils/apiError');
const { createToken } = require('./tokenService');

// signup user
exports.signupUser = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new ApiError('Please provide email and password!', 400));
    }

    // 2) Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new ApiError('User already exists!', 400));
    }

    // 3) Create new user
    const user = await User.create({
        name,
        email,
        password,
    });
    // 4) Create token
    const token = createToken(user._id);

    // 6) Send response
    res.status(201).json({
        status: 'success',
        data: user,
        token
    });

});