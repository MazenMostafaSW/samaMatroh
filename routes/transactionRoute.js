
const express = require('express');
const { protect, allowedTo } = require('../services/auth/index');
const {
    sendMoney,
    getUserTransactions,
    getAllTransactions,
    getTransaction,
    deleteTransaction
} = require('../services/transactionService');
const { sendMoneyValidator } = require('../utils/validators/transactionValidator');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/send', sendMoneyValidator, sendMoney);
router.get('/my-transactions', getUserTransactions);

//all routes for admin
router.use(protect, allowedTo('admin'));
router.route('/')
    .get(getAllTransactions);

router.route('/:id')
    .get(getTransaction);

router.delete('/:id', deleteTransaction);

module.exports = router;

