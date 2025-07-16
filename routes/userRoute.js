const express = require('express');
const {
    createUserValidator,
    updateUserValidator,
    getUserValidator,
    toggleUserActiveValidator,
    changeUserPasswordValidator,
    
    updateLoggedUserValidator,
    updateLoggedUserPasswordValidator,
    deleteLoggedUserValidator
} = require('../utils/validators/userValidator');

const { protect, allowedTo } = require('../services/auth/index');

const {
    createUser,
    getUser,
    getUserByID,
    updateUserByID,
    toggleUserActiveStatus,
    uploadUserImage,
    resizeUserImage,
    changeUserPassword,
    getLoggedUserData,
    updateLoggedUserPassword,
    updateLoggedUserData,
    deleteLoggedUserAccount
} = require("../services/userService");

const router = express.Router();

// IMPORTANT: Define specific routes before parameterized routes
// User profile routes - accessible to any logged in user
router.get('/me', 
        protect,
        getLoggedUserData);
router.put('/updateMe', 
        protect, 
        uploadUserImage, 
        resizeUserImage,
        updateLoggedUserValidator, 
        updateLoggedUserData);
router.put('/changeMyPassword', 
        protect,
        updateLoggedUserPasswordValidator, 
        updateLoggedUserPassword);
router.delete('/deleteMe', 
        protect,
        deleteLoggedUserValidator, 
        deleteLoggedUserAccount);

// Admin only routes - require admin role
router.route('/')
    .get(protect, allowedTo('admin'), getUser)
    .post(
        protect,
        allowedTo('admin'),
        uploadUserImage,
        resizeUserImage,
        createUserValidator,
        createUser
    );

// Admin route for changing any user's password
router.put(
    '/changePassword/:id',
    protect,
    allowedTo('admin'),
    changeUserPasswordValidator,
    changeUserPassword
);

// IMPORTANT: Define parameterized routes after specific routes
router.route('/:id')
    .get(getUserValidator, getUserByID)
    .put(
        protect,
        allowedTo('admin'),
        uploadUserImage,
        resizeUserImage,
        updateUserValidator,
        updateUserByID
    );

router.patch(
    '/toggleActive/:id',
    protect,
    allowedTo('admin'),
    toggleUserActiveValidator,
    toggleUserActiveStatus
);

module.exports = router;
