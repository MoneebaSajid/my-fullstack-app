const express = require('express');
const router = express.Router();

const {
  createPayment,
  getMyPayments,
  getAllPayments
} = require('../controllers/payment.controller');

const {
  verifyPassenger,
  verifyAdmin
} = require('../middleware/auth.middleware');

// Passenger Routes
router.post('/create', verifyPassenger, createPayment);
router.get('/my-payments', verifyPassenger, getMyPayments);

// Admin Routes
router.get('/all', verifyAdmin, getAllPayments);

module.exports = router;