const {validationResult} = require('express-validator');


const validatorMiddleware = (req, res, next) => { // Add 'next' here
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next(); // Call next() to pass control to the next middleware
}

module.exports = validatorMiddleware;