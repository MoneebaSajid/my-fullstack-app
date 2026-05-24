const db = require('../config/db');

// ══════════════════════════════════════════
//   PRICING CONSTANTS
// ══════════════════════════════════════════
const HOURS_PER_DAY = 12;    // 1 day = 12 billable hours
const GST_RATE      = 0.05;  // 5% GST

// Driver fee based on experience years
const getDriverFee = (driver, totalHours) => {
  const exp    = parseInt(driver?.experience_years) || 0;
  let   rate   = 500;
  let   minFee = 2000;
  if (exp >= 5) { rate = 1000; minFee = 4000; }
  else if (exp >= 3) { rate = 700; minFee = 3000; }
  return Math.max(Math.ceil(totalHours) * rate, minFee);
};

// ══════════════════════════════════════════
//   CORE FARE CALCULATOR
// ══════════════════════════════════════════
const calculateFare = (vehicle, startTime, endTime, rateType, estimatedDistance, withDriver = false, driver = null) => {
  const start      = new Date(startTime);
  const end        = new Date(endTime);
  const diffMs     = end - start;
  if (diffMs <= 0) return { error: 'End time must be after start time!' };

  const totalHours  = diffMs / (1000 * 60 * 60);
  const billedHours = Math.max(1, Math.ceil(totalHours));
  const billedDays  = Math.max(1, Math.ceil(totalHours / HOURS_PER_DAY));
  const distanceKm = parseFloat(estimatedDistance) || 0;

  const farePerHour = parseFloat(vehicle.fare_per_hour) || 0;
  const farePerKm   = parseFloat(vehicle.fare_per_km) || 0;
  const farePerDayRate = farePerHour * HOURS_PER_DAY;

  let baseFare     = 0;
  let durationLabel = '';

  if (rateType === 'hourly') {
    const hrs  = billedHours;
    baseFare   = hrs * farePerHour;
    durationLabel = `${hrs} hr(s) × Rs.${farePerHour}/hr`;
  } else if (rateType === 'daily') {
    const days = billedDays;
    baseFare   = days * farePerDayRate;
    durationLabel = `${days} day(s) x Rs.${farePerDayRate}/day`;
  } else if (rateType === 'per_km') {
    baseFare   = distanceKm * farePerKm;
    durationLabel = `${distanceKm} km x Rs.${farePerKm}/km`;
  }

  if (!['hourly', 'daily', 'per_km'].includes(rateType)) {
    return { error: 'Invalid rate type!' };
  }

  // Distance charge only for the selected per-km fare.
  const distanceCharge = 0;

  // Driver fee (experience-based)
  const driverFee = withDriver ? getDriverFee(driver, totalHours) : 0;

  const subtotal   = Math.round(baseFare) + driverFee;
  const taxAmount  = Math.round(subtotal * GST_RATE);
  const totalAmount = subtotal + taxAmount;

  return {
    rate_type:       rateType,
    duration_hours:  parseFloat(totalHours.toFixed(2)),
    duration_label:  durationLabel,
    distance_km:     distanceKm,
    fare_per_hour:   farePerHour,
    fare_per_day:    farePerDayRate,
    fare_per_km:     farePerKm,
    per_km_rate:     farePerKm,
    base_fare:       Math.round(baseFare),
    distance_charge: distanceCharge,
    driver_fee:      driverFee,
    subtotal:        subtotal,
    tax_rate:        '5% GST',
    tax_amount:      taxAmount,
    total_amount:    totalAmount,
  };
};

// ══════════════════════════════════════════
//   CREATE BOOKING WITH DRIVER
// ══════════════════════════════════════════
const createBookingWithDriver = async (req, res) => {
  try {
    const {
      vehicle_id, driver_id, start_time, end_time,
      rate_type, pickup_location, dropoff_location,
      estimated_distance, special_requests
    } = req.body;

    const passenger_id = req.user.id;

    if (!pickup_location || !dropoff_location) {
      return res.status(400).json({ message: '❌ Pickup and dropoff locations required!' });
    }
    if (!estimated_distance || parseFloat(estimated_distance) <= 0) {
      return res.status(400).json({ message: '❌ Valid distance required!' });
    }

    // Get vehicle
    const [vehicles] = await db.query(
      'SELECT * FROM Vehicle WHERE vehicle_id = ?', [vehicle_id]
    );
    if (!vehicles.length) {
      return res.status(404).json({ message: '❌ Vehicle not found!' });
    }
    if (vehicles[0].availability !== 'available') {
      return res.status(400).json({ message: '❌ Vehicle not available!' });
    }

    // Get driver
    const [drivers] = await db.query(
      'SELECT * FROM Driver WHERE driver_id = ?', [driver_id]
    );
    if (!drivers.length) {
      return res.status(404).json({ message: '❌ Driver not found!' });
    }

    // Calculate fare
    const fare = calculateFare(
      vehicles[0], start_time, end_time,
      rate_type, estimated_distance, true, drivers[0]
    );
    if (fare.error) {
      return res.status(400).json({ message: `❌ ${fare.error}` });
    }

    // Insert booking
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
      fare.total_amount, pickup_location,
      dropoff_location, estimated_distance,
      special_requests || ''
    ]);

    const booking_id = result.insertId;

    // Lock vehicle & driver
    await db.query('UPDATE Vehicle SET availability = ? WHERE vehicle_id = ?', ['booked', vehicle_id]);
    await db.query('UPDATE Driver SET availability_status = ? WHERE driver_id = ?', ['unavailable', driver_id]);

    // Auto-generate receipt
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

// ══════════════════════════════════════════
//   CREATE BOOKING WITHOUT DRIVER
// ══════════════════════════════════════════
const createBookingWithoutDriver = async (req, res) => {
  try {
    const {
      vehicle_id, start_date, end_date, rate_type,
      self_pickup_location, onsite_location,
      estimated_distance, special_requests
    } = req.body;

    const passenger_id = req.user.id;

    if (!self_pickup_location || !onsite_location) {
      return res.status(400).json({ message: '❌ Pickup and dropoff locations required!' });
    }
    if (!estimated_distance || parseFloat(estimated_distance) <= 0) {
      return res.status(400).json({ message: '❌ Valid distance required!' });
    }

    const [vehicles] = await db.query(
      'SELECT * FROM Vehicle WHERE vehicle_id = ?', [vehicle_id]
    );
    if (!vehicles.length) {
      return res.status(404).json({ message: '❌ Vehicle not found!' });
    }
    if (vehicles[0].availability !== 'available') {
      return res.status(400).json({ message: '❌ Vehicle not available!' });
    }

    const fare = calculateFare(
      vehicles[0], start_date, end_date,
      rate_type, estimated_distance, false, null
    );
    if (fare.error) {
      return res.status(400).json({ message: `❌ ${fare.error}` });
    }

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
      fare.total_amount, self_pickup_location,
      onsite_location, estimated_distance,
      special_requests || ''
    ]);

    const booking_id = result.insertId;

    await db.query('UPDATE Vehicle SET availability = ? WHERE vehicle_id = ?', ['booked', vehicle_id]);

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

// ══════════════════════════════════════════
//   GET MY BOOKINGS (PASSENGER)
// ══════════════════════════════════════════
const getMyBookings = async (req, res) => {
  try {
    const passenger_id = req.user.id;

    const [withDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number, v.color,
             v.fare_per_hour, v.fare_per_day, v.fare_per_km,
             d.name as driver_name, d.phone as driver_phone,
             d.experience_years, p.name as passenger_name
      FROM BookingWithDriver b
      LEFT JOIN Vehicle v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Driver d ON b.driver_id = d.driver_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      WHERE b.passenger_id = ?
      ORDER BY b.created_at DESC
    `, [passenger_id]);

    const [withoutDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number, v.color,
             v.fare_per_hour, v.fare_per_day, v.fare_per_km,
             p.name as passenger_name
      FROM BookingWithoutDriver b
      LEFT JOIN Vehicle v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      WHERE b.passenger_id = ?
      ORDER BY b.created_at DESC
    `, [passenger_id]);

    res.status(200).json({
      message: '✅ Bookings fetched!',
      bookings_with_driver: withDriver,
      bookings_without_driver: withoutDriver,
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════
//   GET ALL BOOKINGS (ADMIN)
// ══════════════════════════════════════════
const getAllBookings = async (req, res) => {
  try {
    const [withDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number,
             d.name as driver_name, p.name as passenger_name
      FROM BookingWithDriver b
      LEFT JOIN Vehicle v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Driver d ON b.driver_id = d.driver_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      ORDER BY b.created_at DESC
    `);

    const [withoutDriver] = await db.query(`
      SELECT b.*, v.model, v.reg_number, p.name as passenger_name
      FROM BookingWithoutDriver b
      LEFT JOIN Vehicle v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      ORDER BY b.created_at DESC
    `);

    res.status(200).json({
      message: '✅ All bookings fetched!',
      bookings_with_driver: withDriver,
      bookings_without_driver: withoutDriver,
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════
//   GET DRIVER BOOKINGS
// ══════════════════════════════════════════
const getDriverBookings = async (req, res) => {
  try {
    const driver_id = req.user.id;

    const [bookings] = await db.query(`
      SELECT b.*, v.model, v.reg_number,
             p.name as passenger_name, p.phone as passenger_phone
      FROM BookingWithDriver b
      LEFT JOIN Vehicle v ON b.vehicle_id = v.vehicle_id
      LEFT JOIN Passenger p ON b.passenger_id = p.passenger_id
      WHERE b.driver_id = ?
      ORDER BY b.created_at DESC
    `, [driver_id]);

    res.status(200).json({
      message: '✅ Driver bookings fetched!',
      bookings,
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ══════════════════════════════════════════
//   UPDATE BOOKING STATUS
// ══════════════════════════════════════════
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
          await db.query('UPDATE Vehicle SET availability = ? WHERE vehicle_id = ?', ['available', rows[0].vehicle_id]);
          await db.query('UPDATE Driver SET availability_status = ? WHERE driver_id = ?', ['available', rows[0].driver_id]);
          await db.query('UPDATE Receipt SET payment_status = ? WHERE booking_with_driver_id = ?', ['completed', booking_id]);
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
          await db.query('UPDATE Vehicle SET availability = ? WHERE vehicle_id = ?', ['available', rows[0].vehicle_id]);
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
