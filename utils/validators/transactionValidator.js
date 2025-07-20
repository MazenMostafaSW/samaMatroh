const { check } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.sendMoneyValidator = [
    check('receiverId')
        .isMongoId()
        .withMessage('Invalid receiver ID'),
    
    check('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    
    check('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),

    validatorMiddleware,
];