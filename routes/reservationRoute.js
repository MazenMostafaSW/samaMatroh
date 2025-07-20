const {
    createReservationWithBalance,
    updateReservationWithBalance,
    deleteReservationWithRefund,
    getUserBalance
} = require('../services/reservationBalanceService');

// Add these routes
router.post('/', protect, createReservationWithBalance);
router.put('/:id', protect, updateReservationWithBalance);
router.delete('/:id', protect, deleteReservationWithRefund);
router.get('/my-balance', protect, getUserBalance);