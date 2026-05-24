const express = require('express');
const router = express.Router();

const {
  updateDriverLocation,
  getDriverLocation,
  getLocationHistory,
  getAllDriversLocations,
  getNearestDrivers
} = require('../controllers/tracking.controller');

const {
  verifyToken,
  verifyAdmin,
  verifyDriver
} = require('../middleware/auth.middleware');

// Driver sends location
router.post('/update', verifyDriver, updateDriverLocation);

// Get single driver location
router.get('/driver/:driver_id', verifyToken, getDriverLocation);

// Location history
router.get('/history/:booking_id', verifyToken, getLocationHistory);

// Admin — ALL drivers live locations
router.get('/all-drivers', verifyAdmin, getAllDriversLocations);

// Passenger — nearest available drivers
router.get('/nearest', verifyToken, getNearestDrivers);

module.exports = router;