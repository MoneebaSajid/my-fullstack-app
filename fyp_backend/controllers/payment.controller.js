// const db = require('../config/db');

// // ==================== CREATE PAYMENT ====================
// const createPayment = async (req, res) => {
//   try {
//     const {
//       booking_with_driver_id,
//       booking_without_driver_id,
//       gateway_id,
//       amount,
//       currency,
//       payment_method,
//       payment_type,
//       transaction_reference,
//       remarks
//     } = req.body;

//     const passenger_id = req.user.id;

//     // Check gateway exists
//     const [gateway] = await db.query(
//       'SELECT * FROM Payment_Gateway WHERE gateway_id = ?',
//       [gateway_id]
//     );
//     if (gateway.length === 0) {
//       return res.status(404).json({ message: '❌ Payment gateway not found!' });
//     }

//     // Insert payment
//     await db.query(`
//       INSERT INTO Payment 
//       (booking_with_driver_id, booking_without_driver_id, gateway_id,
//        passenger_id, amount, currency, payment_method, payment_status,
//        payment_type, transaction_reference, remarks, payment_time)
//       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, NOW())
//     `, [
//       booking_with_driver_id || null,
//       booking_without_driver_id || null,
//       gateway_id,
//       passenger_id,
//       amount,
//       currency,
//       payment_method,
//       payment_type,
//       transaction_reference,
//       remarks
//     ]);

//     // Update booking payment status
//     if (booking_with_driver_id) {
//       await db.query(
//         'UPDATE BookingWithDriver SET status = ? WHERE booking_id = ?',
//         ['confirmed', booking_with_driver_id]
//       );
//     }

//     if (booking_without_driver_id) {
//       await db.query(
//         'UPDATE BookingWithoutDriver SET status = ? WHERE booking_id = ?',
//         ['confirmed', booking_without_driver_id]
//       );
//     }

//     res.status(201).json({
//       message: '✅ Payment successful!',
//       amount,
//       payment_method,
//       status: 'completed'
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// // ==================== GET MY PAYMENTS (PASSENGER) ====================
// const getMyPayments = async (req, res) => {
//   try {
//     const passenger_id = req.user.id;

//     const [payments] = await db.query(`
//       SELECT p.*, pg.gateway_name
//       FROM Payment p
//       JOIN Payment_Gateway pg ON p.gateway_id = pg.gateway_id
//       WHERE p.passenger_id = ?
//       ORDER BY p.payment_time DESC
//     `, [passenger_id]);

//     res.status(200).json({
//       message: '✅ Payments fetched successfully!',
//       total: payments.length,
//       payments
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// // ==================== GET ALL PAYMENTS (ADMIN) ====================
// const getAllPayments = async (req, res) => {
//   try {
//     const [payments] = await db.query(`
//       SELECT p.*, pg.gateway_name,
//              ps.name as passenger_name
//       FROM Payment p
//       JOIN Payment_Gateway pg ON p.gateway_id = pg.gateway_id
//       JOIN Passenger ps ON p.passenger_id = ps.passenger_id
//       ORDER BY p.payment_time DESC
//     `);

//     res.status(200).json({
//       message: '✅ All payments fetched successfully!',
//       total: payments.length,
//       payments
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// module.exports = {
//   createPayment,
//   getMyPayments,
//   getAllPayments
// };






const db = require('../config/db');

// ── Constants ──
// Normalized to lowercase, stripped of spaces for robust validation
const VALID_GATEWAYS = [
  'jazzcash',
  'easypaisa',
  'hbl',
  'hblpay',
  'visa',
  'mastercard',
  'bank_transfer',
  'banktransfer'
];

/**
 * @desc    Create a new payment and update booking status
 * @route   POST /api/payments
 * @access  Private (Passenger)
 */
const createPayment = async (req, res) => {
  try {
    const {
      booking_id,
      booking_type,
      payment_method,
      amount,
      currency = 'PKR',
      transaction_ref,
      payment_details,
    } = req.body;

    const passenger_id = req.user.id;

    // 1. Validate required fields
    if (!booking_id || !payment_method || !amount) {
      return res.status(400).json({
        message: '❌ booking_id, payment_method, and amount are required!'
      });
    }

    // 2. Validate payment method (accept all configured gateways)
    const methodLower = (payment_method || '').toLowerCase().replace(/\s/g, '');
    
    if (!VALID_GATEWAYS.includes(methodLower)) {
      return res.status(400).json({
        message: `❌ Invalid payment gateway: ${payment_method}. Valid options: jazzcash, easypaisa, hbl, visa, mastercard, bank_transfer`
      });
    }

    // 3. Generate transaction ref if not provided
    const txRef = transaction_ref || `NXR-${Date.now()}-${passenger_id}`;

    // 4. Map the frontend booking_id to the correct database column based on booking_type
    const isWithDriver = booking_type === 'with-driver' || booking_type === 'WithDriver';
    const booking_with_driver_id = isWithDriver ? booking_id : null;
    const booking_without_driver_id = isWithDriver ? null : booking_id;

    // 5. Insert payment record matching your exact database schema
    const insertPaymentQuery = `
      INSERT INTO payment (
        passenger_id,
        booking_with_driver_id,
        booking_without_driver_id,
        payment_method,
        amount,
        currency,
        transaction_reference,
        payment_status,
        payment_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())
    `;

    const [result] = await db.query(insertPaymentQuery, [
      passenger_id,
      booking_with_driver_id,
      booking_without_driver_id,
      payment_method,
      amount,
      currency,
      txRef,
    ]);

    // 6. Update booking status to 'confirmed' if payment successful
    try {
      const tableName = isWithDriver ? 'BookingWithDriver' : 'BookingWithoutDriver';
      
      const updateBookingQuery = `
        UPDATE ${tableName} 
        SET status = 'confirmed' 
        WHERE booking_id = ? AND passenger_id = ?
      `;

      await db.query(updateBookingQuery, [booking_id, passenger_id]);
    } catch (updateErr) {
      console.warn('⚠️ Booking status update warning:', updateErr.message);
      // We don't fail the payment if booking update fails, as the payment itself succeeded
    }

    // 7. Return success response
    return res.status(201).json({
      message: '✅ Payment successful!',
      payment_id: result.insertId,
      transaction_ref: txRef,
      amount,
      currency,
      payment_method,
      payment_status: 'completed',
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    return res.status(500).json({
      message: '❌ Server error during payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all payments for the logged-in passenger
 * @route   GET /api/payments/my-payments
 * @access  Private (Passenger)
 */
const getMyPayments = async (req, res) => {
  try {
    const passenger_id = req.user.id;
    
    const query = `
      SELECT * FROM Payment 
      WHERE passenger_id = ? 
      ORDER BY payment_time DESC
    `;
    
    const [payments] = await db.query(query, [passenger_id]);
    
    return res.status(200).json({ payments });
  } catch (error) {
    console.error('❌ Fetch payments error:', error);
    return res.status(500).json({ 
      message: '❌ Server error', 
      error: error.message 
    });
  }
};

/**
 * @desc    Get all system payments with passenger details
 * @route   GET /api/payments/all
 * @access  Private (Admin)
 */
const getAllPayments = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*, 
        ps.name AS passenger_name
      FROM Payment p
      LEFT JOIN Passenger ps ON p.passenger_id = ps.passenger_id
      ORDER BY p.payment_time DESC
    `;

    const [payments] = await db.query(query);
    
    return res.status(200).json({ 
      payments, 
      total: payments.length 
    });
  } catch (error) {
    console.error('❌ Fetch all payments error:', error);
    return res.status(500).json({ 
      message: '❌ Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getAllPayments
};