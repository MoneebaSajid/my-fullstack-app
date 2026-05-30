const express = require('express');
const router  = express.Router();
const {
  processVehicleReturn,
  getRefundStatus,
  getMyRefunds,
  getAllRefunds,
} = require('../controllers/refund.controller');
const { verifyToken, verifyPassenger, verifyAdmin } = require('../middleware/auth.middleware');

// Passenger routes
router.get('/my-refunds',          verifyToken,     getMyRefunds);
router.get('/status/:booking_id',  verifyPassenger, getRefundStatus);

// Driver / Admin marks vehicle returned
router.post('/process-return',     verifyToken,     processVehicleReturn);

// Admin only
router.get('/all',                 verifyAdmin,     getAllRefunds);

module.exports = router;