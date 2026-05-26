/**
 * booking.controller.js  — NexRide
 *
 * Fare Strategy:
 * • Refundable deposit  : Rs. 2,000 (held at booking, returned after trip
 * unless damage / toll deductions apply)
 * • Speed assumption    : 100 km/h  → trip_hours = distance / 100
 * • Per-KM charge       : vehicle.fare_per_km × distance
 * • Hourly rate         : vehicle.fare_per_hour × ceil(trip_hours)
 * • Daily  rate         : vehicle.fare_per_day  × ceil(trip_hours / 12)
 * • Per-KM rate         : vehicle.fare_per_km   × distance  (no hourly on top)
 * • Driver fee          : Flat Rs. 1000
 * • GST                 : 5% on (duration_charge + per_km_charge + driver_fee)
 * • Deposit             : added separately, NOT part of GST base
 * • Total charged now   : subtotal + GST + deposit
 * • After trip          : deposit refunded minus any damage_fee / toll_fee
 */

const db = require('../config/db');

// ── Constants ────────────────────────────────────────────────────────────────
const ASSUMED_SPEED_KMH = 100;
const HOURS_PER_DAY     = 12;
const GST_RATE          = 0.05;
const DEPOSIT_AMOUNT    = 2000;   // refundable
const DRIVER_FLAT_FEE   = 1000;   // flat driver fee

// ── Core fare calculator ─────────────────────────────────────────────────────
const calculateFare = (vehicle, rateType, distanceKm, withDriver, driver) => {
  const dist        = parseFloat(distanceKm) || 0;
  const farePerHour = parseFloat(vehicle.fare_per_hour) || 0;
  const farePerDay  = parseFloat(vehicle.fare_per_day)  || farePerHour * HOURS_PER_DAY;
  const farePerKm   = parseFloat(vehicle.fare_per_km)   || 0;

  // Time derived purely from distance at 100 km/h
  const tripHours   = dist / ASSUMED_SPEED_KMH;           // e.g. 50 km → 0.5 h
  const billedHours = Math.max(1, Math.ceil(tripHours));   // minimum 1 hour
  const billedDays  = Math.max(1, Math.ceil(tripHours / HOURS_PER_DAY));

  // Duration-based charge
  let durationCharge = 0;
  let durationLabel  = '';

  if (rateType === 'hourly') {
    durationCharge = billedHours * farePerHour;
    durationLabel  = `${billedHours} hr(s) × Rs.${farePerHour}/hr`;
  } else if (rateType === 'daily') {
    durationCharge = billedDays * farePerDay;
    durationLabel  = `${billedDays} day(s) × Rs.${farePerDay}/day`;
  } else {
    // per_km — no separate duration charge; distance charge IS the base
    durationCharge = 0;
    durationLabel  = `Per-KM mode`;
  }

  // Per-KM charge (always added except when rate_type is per_km itself,
  // where it already IS the base — avoids double counting)
  const perKmCharge = rateType === 'per_km'
    ? dist * farePerKm
    : dist * farePerKm;   // still added on top for hourly / daily

  // Driver fee (Flat fee, independent of duration/distance)
  const driverFee = (withDriver && driver) ? DRIVER_FLAT_FEE : 0;

  // GST base (deposit excluded)
  const subtotalBeforeDeposit = Math.round(durationCharge + perKmCharge + driverFee);
  const taxAmount              = Math.round(subtotalBeforeDeposit * GST_RATE);

  // What the passenger pays now
  const totalPayNow = subtotalBeforeDeposit + taxAmount + DEPOSIT_AMOUNT;

  return {
    rate_type:        rateType,
    speed_assumption: `${ASSUMED_SPEED_KMH} km/h`,
    distance_km:      dist,
    trip_hours:       parseFloat(tripHours.toFixed(2)),
    billed_hours:     billedHours,
    billed_days:      billedDays,
    duration_label:   durationLabel,
    fare_per_hour:    farePerHour,
    fare_per_day:     farePerDay,
    fare_per_km:      farePerKm,

    duration_charge:  Math.round(durationCharge),
    per_km_charge:    Math.round(perKmCharge),
    driver_fee:       driverFee,

    subtotal:         subtotalBeforeDeposit,
    tax_rate:         '5% GST',
    tax_amount:       taxAmount,

    deposit_amount:   DEPOSIT_AMOUNT,
    deposit_note:     'Refundable after trip — deductions for damage/tolls only',

    total_amount:     totalPayNow,   // charged at booking
    refund_amount:    DEPOSIT_AMOUNT, // maximum refund after trip
  };
};

// ── CREATE BOOKING WITH DRIVER ───────────────────────────────────────────────
const createBookingWithDriver = async (req, res) => {
  try {
    const {
      vehicle_id, driver_id, start_time, end_time,
      rate_type, pickup_location, dropoff_location,
      estimated_distance, special_requests,
    } = req.body;

    const passenger_id = req.user.id;

    if (!pickup_location || !dropoff_location)
      return res.status(400).json({ message: '❌ Pickup and dropoff locations required!' });
    if (!estimated_distance || parseFloat(estimated_distance) <= 0)
      return res.status(400).json({ message: '❌ Valid distance required!' });

    const [vehicles] = await db.query('SELECT * FROM Vehicle WHERE vehicle_id = ?', [vehicle_id]);
    if (!vehicles.length)
      return res.status(404).json({ message: '❌ Vehicle not found!' });
    if (vehicles[0].availability !== 'available')
      return res.status(400).json({ message: '❌ Vehicle not available!' });

    const [drivers] = await db.query('SELECT * FROM Driver WHERE driver_id = ?', [driver_id]);
    if (!drivers.length)
      return res.status(404).json({ message: '❌ Driver not found!' });

    const fare = calculateFare(
      vehicles[0], rate_type, estimated_distance, true, drivers[0]
    );

    const [result] = await db.query(`
      INSERT INTO BookingWithDriver
      (passenger_id, vehicle_id, driver_id, booking_date,
       start_time, end_time, rate_type, total_amount, status,
       pickup_location, dropoff_location, estimated_distance,
       special_requests, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW(), NOW())
    `, [
      passenger_id, vehicle_id, driver_id,
      start_time, end_time, rate_type,
      fare.total_amount,
      pickup_location, dropoff_location,
      estimated_distance, special_requests || '',
    ]);

    const booking_id = result.insertId;

    // Lock vehicle & driver
    await db.query("UPDATE Vehicle SET availability = 'booked' WHERE vehicle_id = ?", [vehicle_id]);
    await db.query("UPDATE Driver SET availability_status = 'unavailable' WHERE driver_id = ?", [driver_id]);

    const receiptNumber = `NXR-${Date.now()}`;
    await db.query(`
      INSERT INTO Receipt
      (receipt_number, booking_with_driver_id, tax_amount,
       total_fare, currency, payment_status, payment_method, generated_time)
      VALUES (?, ?, ?, ?, 'PKR', 'pending', 'pending', NOW())
    `, [receiptNumber, booking_id, fare.tax_amount, fare.total_amount]);

    res.status(201).json({
      message:        '✅ Booking created successfully!',
      booking_id,
      receipt_number: receiptNumber,
      total_amount:   fare.total_amount,
      fare_details:   fare,
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ── CREATE BOOKING WITHOUT DRIVER ────────────────────────────────────────────
const createBookingWithoutDriver = async (req, res) => {
  try {
    const {
      vehicle_id, start_date, end_date, rate_type,
      self_pickup_location, onsite_location,
      estimated_distance, special_requests,
    } = req.body;

    const passenger_id = req.user.id;

    if (!self_pickup_location || !onsite_location)
      return res.status(400).json({ message: '❌ Pickup and dropoff locations required!' });
    if (!estimated_distance || parseFloat(estimated_distance) <= 0)
      return res.status(400).json({ message: '❌ Valid distance required!' });

    const [vehicles] = await db.query('SELECT * FROM Vehicle WHERE vehicle_id = ?', [vehicle_id]);
    if (!vehicles.length)
      return res.status(404).json({ message: '❌ Vehicle not found!' });
    if (vehicles[0].availability !== 'available')
      return res.status(400).json({ message: '❌ Vehicle not available!' });

    const fare = calculateFare(
      vehicles[0], rate_type, estimated_distance, false, null
    );

    const [result] = await db.query(`
      INSERT INTO BookingWithoutDriver
      (passenger_id, vehicle_id, booking_date, start_date,
       end_date, rate_type, total_amount, status,
       self_pickup_location, onsite_location,
       estimated_distance, special_requests, created_at, updated_at)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW(), NOW())
    `, [
      passenger_id, vehicle_id,
      start_date, end_date, rate_type,
      fare.total_amount,
      self_pickup_location, onsite_location,
      estimated_distance, special_requests || '',
    ]);

    const booking_id = result.insertId;

    await db.query("UPDATE Vehicle SET availability = 'booked' WHERE vehicle_id = ?", [vehicle_id]);

    const receiptNumber = `NXR-${Date.now()}`;
    await db.query(`
      INSERT INTO Receipt
      (receipt_number, booking_without_driver_id, tax_amount,
       total_fare, currency, payment_status, payment_method, generated_time)
      VALUES (?, ?, ?, ?, 'PKR', 'pending', 'pending', NOW())
    `, [receiptNumber, booking_id, fare.tax_amount, fare.total_amount]);

    res.status(201).json({
      message:        '✅ Booking created!',
      booking_id,
      receipt_number: receiptNumber,
      total_amount:   fare.total_amount,
      fare_details:   fare,
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ── GET MY BOOKINGS (PASSENGER) ──────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const passenger_id = req.user.id;

    const [withDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number, v.color,
             v.fare_per_hour, v.fare_per_day, v.fare_per_km,
             d.name as driver_name, d.phone as driver_phone,
             d.experience_years, p.name as passenger_name
      FROM BookingWithDriver b
      LEFT JOIN Vehicle  v ON b.vehicle_id   = v.vehicle_id
      LEFT JOIN Driver   d ON b.driver_id    = d.driver_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      WHERE b.passenger_id = ?
      ORDER BY b.created_at DESC
    `, [passenger_id]);

    const [withoutDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number, v.color,
             v.fare_per_hour, v.fare_per_day, v.fare_per_km,
             p.name as passenger_name
      FROM BookingWithoutDriver b
      LEFT JOIN Vehicle  v ON b.vehicle_id   = v.vehicle_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      WHERE b.passenger_id = ?
      ORDER BY b.created_at DESC
    `, [passenger_id]);

    res.status(200).json({
      message:                  '✅ Bookings fetched!',
      bookings_with_driver:     withDriver,
      bookings_without_driver:  withoutDriver,
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ── GET ALL BOOKINGS (ADMIN) ─────────────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const [withDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number,
             d.name as driver_name, p.name as passenger_name
      FROM BookingWithDriver b
      LEFT JOIN Vehicle  v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Driver   d ON b.driver_id  = d.driver_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      ORDER BY b.created_at DESC
    `);
    const [withoutDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number, p.name as passenger_name
      FROM BookingWithoutDriver b
      LEFT JOIN Vehicle  v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      ORDER BY b.created_at DESC
    `);
    res.status(200).json({
      message: '✅ All bookings fetched!',
      bookings_with_driver:    withDriver,
      bookings_without_driver: withoutDriver,
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ── GET DRIVER BOOKINGS ──────────────────────────────────────────────────────
const getDriverBookings = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const [bookings] = await db.query(`
      SELECT b.*, v.model, v.reg_number,
             p.name as passenger_name, p.phone as passenger_phone
      FROM BookingWithDriver b
      LEFT JOIN Vehicle  v ON b.vehicle_id   = v.vehicle_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      WHERE b.driver_id = ?
      ORDER BY b.created_at DESC
    `, [driver_id]);
    res.status(200).json({ message: '✅ Driver bookings fetched!', bookings });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ── UPDATE BOOKING STATUS ────────────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { status, booking_type } = req.body;

    if (booking_type === 'with-driver') {
      await db.query(
        'UPDATE BookingWithDriver SET status = ?, updated_at = NOW() WHERE booking_id = ?',
        [status, booking_id]
      );
      if (status === 'completed') {
        const [rows] = await db.query(
          'SELECT vehicle_id, driver_id FROM BookingWithDriver WHERE booking_id = ?',
          [booking_id]
        );
        if (rows.length) {
          await db.query("UPDATE Vehicle SET availability = 'available' WHERE vehicle_id = ?", [rows[0].vehicle_id]);
          await db.query("UPDATE Driver  SET availability_status = 'available' WHERE driver_id = ?", [rows[0].driver_id]);
          await db.query("UPDATE Receipt SET payment_status = 'completed' WHERE booking_with_driver_id = ?", [booking_id]);
        }
      }
    } else {
      await db.query(
        'UPDATE BookingWithoutDriver SET status = ?, updated_at = NOW() WHERE booking_id = ?',
        [status, booking_id]
      );
      if (status === 'completed') {
        const [rows] = await db.query(
          'SELECT vehicle_id FROM BookingWithoutDriver WHERE booking_id = ?',
          [booking_id]
        );
        if (rows.length) {
          await db.query("UPDATE Vehicle SET availability = 'available' WHERE vehicle_id = ?", [rows[0].vehicle_id]);
        }
      }
    }
    res.status(200).json({ message: `✅ Status updated to ${status}!` });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
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