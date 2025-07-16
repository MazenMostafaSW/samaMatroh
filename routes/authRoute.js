
const express = require('express');
const passport = require('passport');
const {
    signupUserValidator,
    loginUserValidator,
    forgotPasswordValidator,
    verifyResetCodeValidator,
    resetPasswordValidator
} = require('../utils/validators/authValidator');

const { 
    signupUser,
    loginUser,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    logout,

} = require('../services/auth/index');
const User = require('../models/userModel');
const router = express.Router();

// Authentication routes
router.post('/signup', signupUserValidator, signupUser);
router.post('/login', loginUserValidator, loginUser);

// Password management
router.post('/forgotPassword', forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyResetCodeValidator, verifyResetCode);
router.put('/resetPassword', resetPasswordValidator, resetPassword);

// Logout
router.get('/logout', logout);


// Check if token is saved in user document
router.get('/verify-token-saved', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || 
                req.headers.token?.split(' ')[1] || 
                req.cookies?.jwt;
    
    if (!token) {
      return res.status(400).json({
        status: 'fail',
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with this ID and check if token is saved
    const user = await User.findById(decoded.id).select('+authToken');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        tokenSaved: user.authToken === token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;

