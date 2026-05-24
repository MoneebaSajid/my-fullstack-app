const db = require('../config/db');

// ==================== CREATE PAYMENT ====================
const createPayment = async (req, res) => {
  try {
    const {
      booking_with_driver_id,
      booking_without_driver_id,
      gateway_id,
      amount,
      currency,
      payment_method,
      payment_type,
      transaction_reference,
      remarks
    } = req.body;

    const passenger_id = req.user.id;

    // Check gateway exists
    const [gateway] = await db.query(
      'SELECT * FROM Payment_Gateway WHERE gateway_id = ?',
      [gateway_id]
    );
    if (gateway.length === 0) {
      return res.status(404).json({ message: '❌ Payment gateway not found!' });
    }

    // Insert payment
    await db.query(`
      INSERT INTO Payment 
      (booking_with_driver_id, booking_without_driver_id, gateway_id,
       passenger_id, amount, currency, payment_method, payment_status,
       payment_type, transaction_reference, remarks, payment_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, NOW())
    `, [
      booking_with_driver_id || null,
      booking_without_driver_id || null,
      gateway_id,
      passenger_id,
      amount,
      currency,
      payment_method,
      payment_type,
      transaction_reference,
      remarks
    ]);

    // Update booking payment status
    if (booking_with_driver_id) {
      await db.query(
        'UPDATE BookingWithDriver SET status = ? WHERE booking_id = ?',
        ['confirmed', booking_with_driver_id]
      );
    }

    if (booking_without_driver_id) {
      await db.query(
        'UPDATE BookingWithoutDriver SET status = ? WHERE booking_id = ?',
        ['confirmed', booking_without_driver_id]
      );
    }

    res.status(201).json({
      message: '✅ Payment successful!',
      amount,
      payment_method,
      status: 'completed'
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET MY PAYMENTS (PASSENGER) ====================
const getMyPayments = async (req, res) => {
  try {
    const passenger_id = req.user.id;

    const [payments] = await db.query(`
      SELECT p.*, pg.gateway_name
      FROM Payment p
      JOIN Payment_Gateway pg ON p.gateway_id = pg.gateway_id
      WHERE p.passenger_id = ?
      ORDER BY p.payment_time DESC
    `, [passenger_id]);

    res.status(200).json({
      message: '✅ Payments fetched successfully!',
      total: payments.length,
      payments
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET ALL PAYMENTS (ADMIN) ====================
const getAllPayments = async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT p.*, pg.gateway_name,
             ps.name as passenger_name
      FROM Payment p
      JOIN Payment_Gateway pg ON p.gateway_id = pg.gateway_id
      JOIN Passenger ps ON p.passenger_id = ps.passenger_id
      ORDER BY p.payment_time DESC
    `);

    res.status(200).json({
      message: '✅ All payments fetched successfully!',
      total: payments.length,
      payments
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments
};