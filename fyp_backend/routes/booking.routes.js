const express = require('express');
const router = express.Router();
const db = require('../config/db');


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
// router.put('/update-status/:booking_id', verifyDriver, updateBookingStatus);
// ── Yeh booking.routes.js mein add karo ──

// Driver marks trip status
router.put('/update-status', verifyDriver, async (req, res) => {  try {
    const { booking_id, booking_type, status } = req.body;
    const driver_id = req.user.id;

    const VALID = ['started', 'completed', 'cancelled'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ message: `Invalid status! Use: ${VALID.join(', ')}` });
    }

    const table = booking_type === 'with-driver'
      ? 'BookingWithDriver'
      : 'BookingWithoutDriver';

    const idCol = booking_type === 'with-driver'
      ? 'booking_id'
      : 'booking_id';

    // with-driver: verify driver owns this booking
    if (booking_type === 'with-driver') {
      const [rows] = await db.query(
        `SELECT booking_id FROM BookingWithDriver
         WHERE booking_id = ? AND driver_id = ?`,
        [booking_id, driver_id]
      );
      if (rows.length === 0) {
        return res.status(403).json({ message: '❌ Not your booking!' });
      }
    }

    await db.query(
      `UPDATE ${table} SET status = ? WHERE booking_id = ?`,
      [status, booking_id]
    );

    // If completed → also release vehicle + driver
    if (status === 'completed') {
      // Get vehicle_id
      const [booking] = await db.query(
        `SELECT vehicle_id FROM ${table} WHERE booking_id = ?`,
        [booking_id]
      );
      if (booking.length > 0) {
        await db.query(
          `UPDATE Vehicle SET availability = 'available' WHERE vehicle_id = ?`,
          [booking[0].vehicle_id]
        );
      }
      if (booking_type === 'with-driver') {
        await db.query(
          `UPDATE Driver SET availability_status = 'available' WHERE driver_id = ?`,
          [driver_id]
        );
      }
    }

    res.status(200).json({
      message: `✅ Booking status updated to '${status}'!`,
      booking_id,
      status,
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
});

// Admin Routes
router.get('/all', verifyAdmin, getAllBookings);

module.exports = router;