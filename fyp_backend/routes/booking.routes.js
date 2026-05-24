const express = require('express');
const router = express.Router();

const {
  createBookingWithDriver,
  createBookingWithoutDriver,
  getMyBookings,
  getAllBookings,
  getDriverBookings,
  updateBookingStatus
} = require('../controllers/booking.controller');

const { 
  verifyPassenger, 
  verifyAdmin,
  verifyDriver
} = require('../middleware/auth.middleware');

// Passenger Routes
router.post('/with-driver', verifyPassenger, createBookingWithDriver);
router.post('/without-driver', verifyPassenger, createBookingWithoutDriver);
router.get('/my-bookings', verifyPassenger, getMyBookings);

// Driver Routes
router.get('/driver/my-bookings', verifyDriver, getDriverBookings);
router.put('/update-status/:booking_id', verifyDriver, updateBookingStatus);

// Admin Routes
router.get('/all', verifyAdmin, getAllBookings);

module.exports = router;