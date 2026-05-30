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
// ══════════════════════════════════════════════════
// GET /api/bookings/open-requests
// Sab pending with-driver bookings jo koi driver
// accept nahi kar sakta (driver accepts system ke liye)
// Abhi humare system mein passenger driver choose karta hai
// lekin hum ek "available requests" view banate hain
// jo sab drivers dekh sakein
// ══════════════════════════════════════════════════
router.get('/open-requests', verifyDriver, async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT bwd.*,
              v.model, v.reg_number, v.fare_per_hour, v.fare_per_km,
              p.name AS passenger_name, p.phone AS passenger_phone
       FROM BookingWithDriver bwd
       LEFT JOIN Vehicle v ON bwd.vehicle_id = v.vehicle_id
       LEFT JOIN Passenger p ON bwd.passenger_id = p.passenger_id
       WHERE bwd.status = 'pending'
       ORDER BY bwd.booking_id DESC`,
      []
    );
    
    return res.status(200).json({ requests, count: requests.length });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
});

// ══════════════════════════════════════════════════
// POST /api/bookings/accept/:booking_id
// Driver accepts a pending booking
// ══════════════════════════════════════════════════
router.post('/accept/:booking_id', verifyDriver, async (req, res) => {
  try {
    const { booking_id } = req.params;
    const driver_id = req.user.id;

    // Check booking exists and is still pending
    const [rows] = await db.query(
      `SELECT * FROM BookingWithDriver WHERE booking_id = ? AND status = 'pending'`,
      [booking_id]
    );

    if (!rows.length) {
      return res.status(400).json({ message: '❌ Booking not available or already taken!' });
    }

    // Check driver is available
    const [driverRows] = await db.query(
      `SELECT availability_status FROM Driver WHERE driver_id = ?`,
      [driver_id]
    );

    if (!driverRows.length || driverRows[0].availability_status !== 'available') {
      return res.status(400).json({ message: '❌ You are not available to accept bookings!' });
    }

    // Assign this driver to booking + confirm it
    await db.query(
      `UPDATE BookingWithDriver
       SET driver_id = ?, status = 'confirmed'
       WHERE booking_id = ?`,
      [driver_id, booking_id]
    );

    // Mark driver as booked
    await db.query(
      `UPDATE Driver SET availability_status = 'booked' WHERE driver_id = ?`,
      [driver_id]
    );

    return res.status(200).json({
      message: '✅ Booking accepted! Passenger has been notified.',
      booking_id,
      driver_id,
      status: 'confirmed',
    });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
});
// Admin Routes
router.get('/all', verifyAdmin, getAllBookings);

module.exports = router;