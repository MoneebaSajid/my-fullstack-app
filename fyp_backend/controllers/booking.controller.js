const db = require('../config/db');

const DEPOSIT_AMOUNT  = 2000;
const HOURS_PER_DAY   = 12;
const GST_RATE        = 0.05;
const DRIVER_FLAT_FEE = 1000;

// ══════════════════════════════════════════════════
// HELPER: Fare calculation
// ══════════════════════════════════════════════════
const calcFare = ({ vehicle, rate_type, start, end, distance_km, driver }) => {
  const farePerHour = parseFloat(vehicle.fare_per_hour) || 0;
  const farePerDay  = parseFloat(vehicle.fare_per_day)  || farePerHour * HOURS_PER_DAY;
  const farePerKm   = parseFloat(vehicle.fare_per_km)   || 0;
  const km          = parseFloat(distance_km) || 0;

  const diffMs   = new Date(end) - new Date(start);
  const diffHrs  = Math.max(1, diffMs / (1000 * 60 * 60));
  const diffDays = Math.max(1, diffHrs / HOURS_PER_DAY);

  let durationCharge = 0;
  let durationLabel  = '';

  if (rate_type === 'hourly') {
    durationCharge = Math.ceil(diffHrs) * farePerHour;
    durationLabel  = `${Math.ceil(diffHrs)} hr(s) × Rs.${farePerHour}`;
  } else if (rate_type === 'daily') {
    durationCharge = Math.ceil(diffDays) * farePerDay;
    durationLabel  = `${Math.ceil(diffDays)} day(s) × Rs.${farePerDay}`;
  } else {
    durationCharge = 0;
    durationLabel  = 'Per-KM only';
  }

  const perKmCharge = Math.round(km * farePerKm);
  const driverFee   = driver ? DRIVER_FLAT_FEE : 0;
  const subtotal    = Math.round(durationCharge) + perKmCharge + driverFee;
  const taxAmount   = Math.round(subtotal * GST_RATE);
  const total       = subtotal + taxAmount + DEPOSIT_AMOUNT;

  return {
    rate_type,
    duration_label:   durationLabel,
    duration_charge:  Math.round(durationCharge),
    per_km_charge:    perKmCharge,
    distance_km:      km,
    driver_fee:       driverFee,
    subtotal,
    tax_amount:       taxAmount,
    deposit_amount:   DEPOSIT_AMOUNT,
    total_amount:     total,
  };
};

// ══════════════════════════════════════════════════
// HELPER: Availability checks — runs before any booking
// ══════════════════════════════════════════════════
const checkAvailability = async ({ vehicle_id, driver_id = null, passenger_id }) => {

  // 1. Vehicle exists and is available
  const [vRows] = await db.query(
    `SELECT availability FROM Vehicle WHERE vehicle_id = ?`,
    [vehicle_id]
  );
  if (!vRows.length) {
    return { ok: false, message: '❌ Vehicle not found!' };
  }
  if (vRows[0].availability !== 'available') {
    return { ok: false, message: '❌ This vehicle is already booked! Please choose another vehicle.' };
  }

  // 2. No active booking on same vehicle
  const [overlapRows] = await db.query(
    `SELECT booking_id FROM BookingWithDriver
       WHERE vehicle_id = ? AND status NOT IN ('cancelled','completed')
     UNION ALL
     SELECT booking_id FROM BookingWithoutDriver
       WHERE vehicle_id = ? AND status NOT IN ('cancelled','completed')
     LIMIT 1`,
    [vehicle_id, vehicle_id]
  );
  if (overlapRows.length > 0) {
    return { ok: false, message: '❌ Vehicle already has an active booking! Please choose another vehicle.' };
  }

  // 3. Driver availability (if with-driver booking)
  if (driver_id) {
    const [dRows] = await db.query(
      `SELECT availability_status FROM Driver WHERE driver_id = ?`,
      [driver_id]
    );
    if (!dRows.length) {
      return { ok: false, message: '❌ Driver not found!' };
    }
    if (dRows[0].availability_status !== 'available') {
      return { ok: false, message: '❌ This driver is not available! Please choose another driver.' };
    }
  }

  // 4. Passenger must not have another active booking
  // const [pRows] = await db.query(
  //   `SELECT booking_id FROM BookingWithDriver
  //      WHERE passenger_id = ? AND status IN ('pending','confirmed','started')
  //    UNION ALL
  //    SELECT booking_id FROM BookingWithoutDriver
  //      WHERE passenger_id = ? AND status IN ('pending','confirmed','started')
  //    LIMIT 1`,
  //   [passenger_id, passenger_id]
  // );
  // if (pRows.length > 0) {
  //   return { ok: false, message: '❌ You already have an active booking! Please complete or cancel it first.' };
  // }

  return { ok: true };
};

// ══════════════════════════════════════════════════
// POST /api/bookings/with-driver
// ══════════════════════════════════════════════════
const createBookingWithDriver = async (req, res) => {
  try {
    const {
      vehicle_id, driver_id, start_time, end_time,
      rate_type = 'hourly', pickup_location,
      dropoff_location, estimated_distance = 0, special_requests = '',
    } = req.body;

    const passenger_id = req.user.id;

    if (!vehicle_id || !driver_id || !start_time || !end_time || !pickup_location || !dropoff_location) {
      return res.status(400).json({ message: '❌ Please fill all required fields!' });
    }

    // ── Availability checks ──
    const check = await checkAvailability({ vehicle_id, driver_id, passenger_id });
    if (!check.ok) return res.status(400).json({ message: check.message });

    // ── Fetch vehicle ──
    const [vehicles] = await db.query(
      `SELECT v.*, vt.type_name FROM Vehicle v
       LEFT JOIN VehicleType vt ON v.vehicle_type_id = vt.vehicle_type_id
       WHERE v.vehicle_id = ?`,
      [vehicle_id]
    );
    const vehicle = vehicles[0];

    // ── Calculate fare ──
    const fare = calcFare({
      vehicle, rate_type, start: start_time, end: end_time,
      distance_km: estimated_distance, driver: true,
    });

    // ── Generate receipt number ──
    const receipt_number = `NXR-WD-${Date.now()}`;

    // ── Insert booking ──
    const [result] = await db.query(
      `INSERT INTO BookingWithDriver
        (passenger_id, vehicle_id, driver_id, start_time, end_time, rate_type,
         pickup_location, dropoff_location, estimated_distance, special_requests,
         total_amount, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [
        passenger_id, vehicle_id, driver_id, start_time, end_time, rate_type,
        pickup_location, dropoff_location, estimated_distance, special_requests,
        fare.total_amount,
      ]
    );

    // ── Mark vehicle + driver as booked ──
    await db.query(`UPDATE Vehicle SET availability = 'booked' WHERE vehicle_id = ?`, [vehicle_id]);
    await db.query(`UPDATE Driver SET availability_status = 'booked' WHERE driver_id = ?`, [driver_id]);

    // ── Create receipt ──
    try {
      await db.query(
        `INSERT INTO Receipt
          (passenger_id, booking_id, booking_type, receipt_number,
           base_fare, tax_amount, deposit_amount, total_amount, payment_status)
VALUES (?,?,?,?,?,?,?,?,?,?,'confirmed')`, // <-- Changed from 'pending'        [
          passenger_id, result.insertId, 'with-driver', receipt_number,
          fare.duration_charge + fare.per_km_charge + fare.driver_fee,
          fare.tax_amount, fare.deposit_amount, fare.total_amount,
        
      );
    } catch (_) {}

    return res.status(201).json({
      message:        '✅ Booking created successfully!',
      booking_id:     result.insertId,
      receipt_number,
      total_amount:   fare.total_amount,
      fare_details:   fare,
    });

  } catch (error) {
    console.error('createBookingWithDriver:', error);
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════════════
// POST /api/bookings/without-driver
// ══════════════════════════════════════════════════
const createBookingWithoutDriver = async (req, res) => {
  try {
    const {
      vehicle_id, start_date, end_date,
      rate_type = 'daily', self_pickup_location,
      onsite_location, estimated_distance = 0, special_requests = '',
    } = req.body;

    const passenger_id = req.user.id;

    if (!vehicle_id || !start_date || !end_date || !self_pickup_location) {
      return res.status(400).json({ message: '❌ Please fill all required fields!' });
    }

    // ── Availability checks ──
    const check = await checkAvailability({ vehicle_id, passenger_id });
    if (!check.ok) return res.status(400).json({ message: check.message });

    // ── Fetch vehicle ──
    const [vehicles] = await db.query(
      `SELECT v.*, vt.type_name FROM Vehicle v
       LEFT JOIN VehicleType vt ON v.vehicle_type_id = vt.vehicle_type_id
       WHERE v.vehicle_id = ?`,
      [vehicle_id]
    );
    const vehicle = vehicles[0];

    // ── Calculate fare ──
    const fare = calcFare({
      vehicle, rate_type, start: start_date, end: end_date,
      distance_km: estimated_distance, driver: false,
    });

    // ── Generate receipt number ──
    const receipt_number = `NXR-SD-${Date.now()}`;

    // ── Insert booking ──
    const [result] = await db.query(
      `INSERT INTO BookingWithoutDriver
        (passenger_id, vehicle_id, start_date, end_date, rate_type,
         self_pickup_location, onsite_location, estimated_distance,
         special_requests, total_amount, status)
VALUES (?,?,?,?,?,?,?,?,?,?,'confirmed')`, // <-- Changed from 'pending'      [
        passenger_id, vehicle_id, start_date, end_date, rate_type,
        self_pickup_location, onsite_location || '', estimated_distance,
        special_requests, fare.total_amount,
      
    );

    // ── Mark vehicle as booked ──
    await db.query(`UPDATE Vehicle SET availability = 'booked' WHERE vehicle_id = ?`, [vehicle_id]);

    // ── Create receipt ──
    try {
      await db.query(
        `INSERT INTO Receipt
          (passenger_id, booking_id, booking_type, receipt_number,
           base_fare, tax_amount, deposit_amount, total_amount, payment_status)
         VALUES (?,?,?,?,?,?,?,?,'pending')`,
        [
          passenger_id, result.insertId, 'without-driver', receipt_number,
          fare.duration_charge + fare.per_km_charge,
          fare.tax_amount, fare.deposit_amount, fare.total_amount,
        ]
      );
    } catch (_) {}

    return res.status(201).json({
      message:        '✅ Booking created successfully!',
      booking_id:     result.insertId,
      receipt_number,
      total_amount:   fare.total_amount,
      fare_details:   fare,
    });

  } catch (error) {
    console.error('createBookingWithoutDriver:', error);
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════════════
// GET /api/bookings/my-bookings  (passenger)
// ══════════════════════════════════════════════════
const getMyBookings = async (req, res) => {
  try {
    const passenger_id = req.user.id;

    const [withDriver] = await db.query(
      `SELECT bwd.*, v.model, v.reg_number, v.fare_per_hour, v.fare_per_day,
              d.name AS driver_name, d.phone AS driver_phone
       FROM BookingWithDriver bwd
       LEFT JOIN Vehicle v ON bwd.vehicle_id = v.vehicle_id
       LEFT JOIN Driver d  ON bwd.driver_id  = d.driver_id
       WHERE bwd.passenger_id = ?
       ORDER BY bwd.booking_id DESC`,
      [passenger_id]
    );

    const [withoutDriver] = await db.query(
      `SELECT bwod.*, v.model, v.reg_number, v.fare_per_hour, v.fare_per_day
       FROM BookingWithoutDriver bwod
       LEFT JOIN Vehicle v ON bwod.vehicle_id = v.vehicle_id
       WHERE bwod.passenger_id = ?
       ORDER BY bwod.booking_id DESC`,
      [passenger_id]
    );

    return res.status(200).json({
      bookings_with_driver:    withDriver,
      bookings_without_driver: withoutDriver,
    });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════════════
// GET /api/bookings/driver/my-bookings  (driver)
// ══════════════════════════════════════════════════
const getDriverBookings = async (req, res) => {
  try {
    const driver_id = req.user.id;

    const [bookings] = await db.query(
      `SELECT bwd.*, v.model, v.reg_number,
              p.name AS passenger_name, p.phone AS passenger_phone
       FROM BookingWithDriver bwd
       LEFT JOIN Vehicle v   ON bwd.vehicle_id   = v.vehicle_id
       LEFT JOIN Passenger p ON bwd.passenger_id = p.passenger_id
       WHERE bwd.driver_id = ?
       ORDER BY bwd.booking_id DESC`,
      [driver_id]
    );

    return res.status(200).json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════════════
// GET /api/bookings/all  (admin)
// ══════════════════════════════════════════════════
const getAllBookings = async (req, res) => {
  try {
    const [withDriver] = await db.query(
      `SELECT bwd.*, v.model, d.name AS driver_name, p.name AS passenger_name
       FROM BookingWithDriver bwd
       LEFT JOIN Vehicle v   ON bwd.vehicle_id   = v.vehicle_id
       LEFT JOIN Driver d    ON bwd.driver_id    = d.driver_id
       LEFT JOIN Passenger p ON bwd.passenger_id = p.passenger_id
       ORDER BY bwd.booking_id DESC`
    );

    const [withoutDriver] = await db.query(
      `SELECT bwod.*, v.model, p.name AS passenger_name
       FROM BookingWithoutDriver bwod
       LEFT JOIN Vehicle v   ON bwod.vehicle_id   = v.vehicle_id
       LEFT JOIN Passenger p ON bwod.passenger_id = p.passenger_id
       ORDER BY bwod.booking_id DESC`
    );

    return res.status(200).json({
      bookings_with_driver:    withDriver,
      bookings_without_driver: withoutDriver,
      total: withDriver.length + withoutDriver.length,
    });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════════════
// PUT /api/bookings/update-status  (driver/admin)
// ══════════════════════════════════════════════════
// const updateBookingStatus = async (req, res) => {
//   try {
//     const { booking_id, booking_type, status } = req.body;

//     const VALID = ['started', 'completed', 'cancelled'];
//     if (!VALID.includes(status)) {
//       return res.status(400).json({ message: `Invalid status! Use: ${VALID.join(', ')}` });
//     }

//     const table = booking_type === 'with-driver'
//       ? 'BookingWithDriver' : 'BookingWithoutDriver';

//     // Get booking details
//     const [rows] = await db.query(
//       `SELECT * FROM ${table} WHERE booking_id = ?`, [booking_id]
//     );
//     if (!rows.length) return res.status(404).json({ message: '❌ Booking not found!' });

//     const booking = rows[0];

//     await db.query(`UPDATE ${table} SET status = ? WHERE booking_id = ?`, [status, booking_id]);

//     // On complete or cancel → release vehicle + driver
//     if (status === 'completed' || status === 'cancelled') {
//       await db.query(
//         `UPDATE Vehicle SET availability = 'available' WHERE vehicle_id = ?`,
//         [booking.vehicle_id]
//       );
//       if (booking_type === 'with-driver' && booking.driver_id) {
//         await db.query(
//           `UPDATE Driver SET availability_status = 'available' WHERE driver_id = ?`,
//           [booking.driver_id]
//         );
//       }
//     }

//     return res.status(200).json({
//       message: `✅ Status updated to '${status}'!`,
//       booking_id,
//       status,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };
// ══════════════════════════════════════════════════
// PUT /api/bookings/update-status  (passenger/driver/admin)
// ══════════════════════════════════════════════════
const updateBookingStatus = async (req, res) => {
  try {
    const { booking_id, booking_type, status } = req.body;
    const userId = req.user.id; // Get the user ID from the token

    const VALID = ['started', 'completed', 'cancelled'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ message: `Invalid status! Use: ${VALID.join(', ')}` });
    }

    const table = booking_type === 'with-driver'
      ? 'BookingWithDriver' : 'BookingWithoutDriver';

    // Get booking details
    const [rows] = await db.query(
      `SELECT * FROM ${table} WHERE booking_id = ?`, [booking_id]
    );
    
    if (!rows.length) return res.status(404).json({ message: '❌ Booking not found!' });

    const booking = rows[0];

    // Optional Security Check: Ensure the user updating is the passenger who owns the booking
    // (You can comment this out if you also want admins/drivers to update it)
    if (booking.passenger_id !== userId) {
      return res.status(403).json({ message: '❌ You are not authorized to update this booking.' });
    }

    await db.query(`UPDATE ${table} SET status = ? WHERE booking_id = ?`, [status, booking_id]);

    // On complete or cancel → release vehicle + driver
    if (status === 'completed' || status === 'cancelled') {
      await db.query(
        `UPDATE Vehicle SET availability = 'available' WHERE vehicle_id = ?`,
        [booking.vehicle_id]
      );
      if (booking_type === 'with-driver' && booking.driver_id) {
        await db.query(
          `UPDATE Driver SET availability_status = 'available' WHERE driver_id = ?`,
          [booking.driver_id]
        );
      }
    }

    return res.status(200).json({
      message: `✅ Trip status successfully updated to '${status}'!`,
      booking_id,
      status,
    });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  createBookingWithDriver,
  createBookingWithoutDriver,
  getMyBookings,
  getAllBookings,
  getDriverBookings,
  updateBookingStatus,
};