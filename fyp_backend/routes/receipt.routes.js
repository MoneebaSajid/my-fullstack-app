const express = require('express');
const router = express.Router();

const {
  generateReceipt,
  getReceiptByBooking,
  getAllReceipts
} = require('../controllers/receipt.controller');

const {
  verifyToken,
  verifyAdmin
} = require('../middleware/auth.middleware');

// Admin Routes
router.post('/generate', verifyAdmin, generateReceipt);
router.get('/all', verifyAdmin, getAllReceipts);

// Any logged in user can get receipt
router.get('/:type/:booking_id', verifyToken, getReceiptByBooking);

module.exports = router;