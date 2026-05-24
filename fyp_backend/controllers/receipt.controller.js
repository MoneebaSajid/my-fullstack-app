const db = require('../config/db');

// ==================== GENERATE RECEIPT ====================
const generateReceipt = async (req, res) => {
  try {
    const {
      booking_with_driver_id,
      booking_without_driver_id,
      challan_fee,
      driver_tip,
      damage_repair_fee,
      discount_amount,
      tax_amount,
      total_fare,
      currency,
      payment_status,
      payment_method,
      notes
    } = req.body;

    // Generate unique receipt number
    const receipt_number = 'RCP-' + Date.now();

    await db.query(`
      INSERT INTO Receipt
      (receipt_number, booking_with_driver_id, booking_without_driver_id,
       challan_fee, driver_tip, damage_repair_fee, discount_amount,
       tax_amount, total_fare, currency, payment_status,
       payment_method, generated_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `, [
      receipt_number,
      booking_with_driver_id || null,
      booking_without_driver_id || null,
      challan_fee || 0,
      driver_tip || 0,
      damage_repair_fee || 0,
      discount_amount || 0,
      tax_amount || 0,
      total_fare,
      currency || 'PKR',
      payment_status,
      payment_method,
      notes
    ]);

    res.status(201).json({
      message: '✅ Receipt generated successfully!',
      receipt_number
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET RECEIPT BY BOOKING ====================
const getReceiptByBooking = async (req, res) => {
  try {
    const { booking_id, type } = req.params;

    let receipt;

    if (type === 'with-driver') {
      [receipt] = await db.query(`
        SELECT * FROM Receipt 
        WHERE booking_with_driver_id = ?
      `, [booking_id]);
    } else {
      [receipt] = await db.query(`
        SELECT * FROM Receipt 
        WHERE booking_without_driver_id = ?
      `, [booking_id]);
    }

    if (receipt.length === 0) {
      return res.status(404).json({ message: '❌ Receipt not found!' });
    }

    res.status(200).json({
      message: '✅ Receipt fetched successfully!',
      receipt: receipt[0]
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET ALL RECEIPTS (ADMIN) ====================
const getAllReceipts = async (req, res) => {
  try {
    const [receipts] = await db.query(`
      SELECT * FROM Receipt
      ORDER BY generated_time DESC
    `);

    res.status(200).json({
      message: '✅ All receipts fetched successfully!',
      total: receipts.length,
      receipts
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  generateReceipt,
  getReceiptByBooking,
  getAllReceipts
};