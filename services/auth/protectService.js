const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../../models/userModel');
const ApiError = require('../../utils/apiError');

// make sure user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
    // 1) Check if token exists, if exists get it from headers or cookies
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.token && req.headers.token.startsWith('Bearer')) {
        token = req.headers.token.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new ApiError('You are not logged in. Please login to access this route', 401));
    }

    // 2) Verify token (no change happens, expired token) and get user id
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return next(new ApiError('Invalid token. Please login again', 401));
        }
        if (err.name === 'TokenExpiredError') {
            return next(new ApiError('Your token has expired. Please login again', 401));
        }
        return next(new ApiError('Authentication error. Please login again', 401));
    }

    // 3) Check if user exists
    const currentUser = await User.findById(decoded.id).select('+authToken');
    if (!currentUser) {
        return next(new ApiError('The user belonging to this token no longer exists', 401));
    }

    // 4) Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter && typeof currentUser.changedPasswordAfter === 'function') {
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new ApiError('User recently changed password! Please login again', 401));
        }
    }

    // 5) Grant access to protected route
    req.user = currentUser;
    
    // Add user ID to body if not present
    if (!req.body.user && req.method !== 'GET') {
        req.body.user = currentUser._id;
    }
    
    next();
});

// Authorization (user role)
exports.allowedTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ApiError('You are not allowed to access this route', 403));
        }
        next();
    });
