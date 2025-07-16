// Export all auth services from this index file
const signupService = require('./signupService');
const loginService = require('./loginService');
const passwordService = require('./passwordService');
const protectService = require('./protectService');
const logoutService = require('./logoutService');
const tokenService = require('./tokenService');



module.exports = {
    // User registration
    signupUser: signupService.signupUser,
    
    // User login
    loginUser: loginService.loginUser,
    
    // Password management
    forgotPassword: passwordService.forgotPassword,
    verifyResetCode: passwordService.verifyResetCode,
    resetPassword: passwordService.resetPassword,
    
    // Authentication middleware
    protect: protectService.protect,
    allowedTo: protectService.allowedTo,
    
    // Logout
    logout: logoutService.logout,
    
    // Token utility
    createToken: tokenService.createToken
};
