const asyncHandler = require('express-async-handler');

// Logout user
exports.logout = asyncHandler(async (req, res, next) => {
    // 1) Clear token from client
    res.clearCookie('token');

    // 2) Send response
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });

});
