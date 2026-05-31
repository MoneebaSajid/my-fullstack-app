const db = require('../config/db');

const DEPOSIT_AMOUNT       = 2000;
const LATE_FEE_PER_HOUR    = 200;   // Rs/hr for < 2 hrs late
const MAX_LATE_FOR_REFUND  = 2;     // > 2 hrs late → no refund
const CLEANING_FEE         = 500;   // flat cleaning fee
const ACCESSORIES_FEE      = 800;   // missing accessories flat fee
const FUEL_RATE_PER_LITRE  = 290;   // Rs per litre

// ════════════════════════════════════════════════
// CORE: Calculate Refund based on return condition
// ════════════════════════════════════════════════
const calculateRefund = ({
  return_condition,
  late_hours          = 0,
  fuel_missing_litres = 0,
  cleaning_required   = false,
  accessories_missing = false,
}) => {
  let deductions  = {};
  let totalDeduct = 0;
  let refundable  = DEPOSIT_AMOUNT;
  let verdict     = 'full';

  // ── 1. Major damage → 0% refund ──
  if (return_condition === 'major_damage') {
    return {
      deposit_amount:         DEPOSIT_AMOUNT,
      late_fee_deduction:     0,
      damage_deduction:       DEPOSIT_AMOUNT,
      cleaning_deduction:     0,
      fuel_deduction:         0,
      accessories_deduction:  0,
      total_deductions:       DEPOSIT_AMOUNT,
      refund_amount:          0,
      verdict:                'no_refund',
      breakdown:              ['❌ Major damage — full deposit forfeited'],
    };
  }

  let breakdown = [];

  // ── 2. Late return ──
  const lateHrs = parseFloat(late_hours) || 0;
  if (lateHrs > MAX_LATE_FOR_REFUND) {
    // More than 2 hours late → no refund
    return {
      deposit_amount:         DEPOSIT_AMOUNT,
      late_fee_deduction:     DEPOSIT_AMOUNT,
      damage_deduction:       0,
      cleaning_deduction:     0,
      fuel_deduction:         0,
      accessories_deduction:  0,
      total_deductions:       DEPOSIT_AMOUNT,
      refund_amount:          0,
      verdict:                'no_refund',
      breakdown:              [`❌ Returned ${lateHrs.toFixed(1)} hours late — no refund`],
    };
  } else if (lateHrs > 0) {
    const lateFee = Math.min(Math.round(lateHrs * LATE_FEE_PER_HOUR), DEPOSIT_AMOUNT);
    deductions.late_fee = lateFee;
    totalDeduct += lateFee;
    breakdown.push(`⏰ Late return (${lateHrs.toFixed(1)} hrs × Rs.${LATE_FEE_PER_HOUR}) = Rs.${lateFee}`);
    verdict = 'partial';
  }

  // ── 3. Minor damage ──
  let damageDeduction = 0;
  if (return_condition === 'minor_damage') {
    damageDeduction = 800; // flat minor damage fee
    deductions.damage = damageDeduction;
    totalDeduct += damageDeduction;
    breakdown.push(`🔧 Minor damage repair fee = Rs.${damageDeduction}`);
    verdict = 'partial';
  }

  // ── 4. Cleaning ──
  let cleaningDeduction = 0;
  if (cleaning_required) {
    cleaningDeduction = CLEANING_FEE;
    deductions.cleaning = cleaningDeduction;
    totalDeduct += cleaningDeduction;
    breakdown.push(`🧹 Cleaning fee = Rs.${cleaningDeduction}`);
    verdict = 'partial';
  }

  // ── 5. Fuel missing ──
  let fuelDeduction = 0;
  const fuelLitres = parseFloat(fuel_missing_litres) || 0;
  if (fuelLitres > 0) {
    fuelDeduction = Math.round(fuelLitres * FUEL_RATE_PER_LITRE);
    deductions.fuel = fuelDeduction;
    totalDeduct += fuelDeduction;
    breakdown.push(`⛽ Fuel shortfall (${fuelLitres}L × Rs.${FUEL_RATE_PER_LITRE}) = Rs.${fuelDeduction}`);
    verdict = 'partial';
  }

  // ── 6. Missing accessories ──
  let accessoriesDeduction = 0;
  if (accessories_missing) {
    accessoriesDeduction = ACCESSORIES_FEE;
    deductions.accessories = accessoriesDeduction;
    totalDeduct += accessoriesDeduction;
    breakdown.push(`🔩 Missing accessories = Rs.${accessoriesDeduction}`);
    verdict = 'partial';
  }

  // ── Final refund ──
  const finalRefund = Math.max(0, DEPOSIT_AMOUNT - totalDeduct);
  if (totalDeduct === 0) {
    breakdown.push('✅ Vehicle returned in perfect condition — full deposit refunded!');
    verdict = 'full';
  }

  return {
    deposit_amount:         DEPOSIT_AMOUNT,
    late_fee_deduction:     deductions.late_fee    || 0,
    damage_deduction:       deductions.damage       || 0,
    cleaning_deduction:     deductions.cleaning     || 0,
    fuel_deduction:         deductions.fuel         || 0,
    accessories_deduction:  deductions.accessories  || 0,
    total_deductions:       totalDeduct,
    refund_amount:          finalRefund,
    verdict,   // 'full' | 'partial' | 'no_refund'
    breakdown,
  };
};

// ════════════════════════════════════════════════
// POST /api/refunds/process-return
// Driver/Admin marks vehicle returned + condition
// ════════════════════════════════════════════════
const processVehicleReturn = async (req, res) => {
  try {
    const {
      booking_id,
      booking_type         = 'without-driver',
      passenger_id,
      return_condition     = 'good',
      late_hours           = 0,
      fuel_missing_litres  = 0,
      cleaning_required    = false,
      accessories_missing  = false,
      damage_description   = '',
    } = req.body;

    if (!booking_id || !passenger_id) {
      return res.status(400).json({ message: '❌ booking_id and passenger_id are required!' });
    }

    // Get original payment method for refund
    const [payments] = await db.query(
      `SELECT payment_method FROM Payment
       WHERE booking_id = ? AND passenger_id = ?
       ORDER BY payment_time DESC LIMIT 1`,
      [booking_id, passenger_id]
    );
    const refundMethod = payments[0]?.payment_method || 'original_method';

    // Calculate refund
    const calc = calculateRefund({
      return_condition,
      late_hours,
      fuel_missing_litres,
      cleaning_required,
      accessories_missing,
    });

    // Check if refund record already exists
    const [existing] = await db.query(
      `SELECT refund_id FROM Refund WHERE booking_id = ? AND passenger_id = ?`,
      [booking_id, passenger_id]
    );

    let refundId;

    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE Refund SET
          return_condition      = ?,
          late_hours            = ?,
          fuel_missing_litres   = ?,
          cleaning_required     = ?,
          accessories_missing   = ?,
          damage_description    = ?,
          late_fee_deduction    = ?,
          damage_deduction      = ?,
          cleaning_deduction    = ?,
          fuel_deduction        = ?,
          accessories_deduction = ?,
          total_deductions      = ?,
          refund_amount         = ?,
          refund_status         = 'approved',
          refund_method         = ?,
          vehicle_returned_at   = NOW(),
          updated_at            = NOW()
        WHERE booking_id = ? AND passenger_id = ?`,
        [
          return_condition, late_hours, fuel_missing_litres,
          cleaning_required ? 1 : 0, accessories_missing ? 1 : 0,
          damage_description,
          calc.late_fee_deduction, calc.damage_deduction,
          calc.cleaning_deduction, calc.fuel_deduction,
          calc.accessories_deduction, calc.total_deductions,
          calc.refund_amount, refundMethod,
          booking_id, passenger_id,
        ]
      );
      refundId = existing[0].refund_id;
    } else {
      // Insert new
      const [result] = await db.query(
        `INSERT INTO Refund (
          booking_id, booking_type, passenger_id, deposit_amount,
          return_condition, late_hours, fuel_missing_litres,
          cleaning_required, accessories_missing, damage_description,
          late_fee_deduction, damage_deduction, cleaning_deduction,
          fuel_deduction, accessories_deduction, total_deductions,
          refund_amount, refund_status, refund_method, vehicle_returned_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'approved',?,NOW())`,
        [
          booking_id, booking_type, passenger_id, DEPOSIT_AMOUNT,
          return_condition, late_hours, fuel_missing_litres,
          cleaning_required ? 1 : 0, accessories_missing ? 1 : 0,
          damage_description,
          calc.late_fee_deduction, calc.damage_deduction,
          calc.cleaning_deduction, calc.fuel_deduction,
          calc.accessories_deduction, calc.total_deductions,
          calc.refund_amount, refundMethod,
        ]
      );
      refundId = result.insertId;
    }

    // Update booking status to 'completed'
    try {
      const table = booking_type === 'with-driver'
        ? 'BookingWithDriver' : 'BookingWithoutDriver';
      await db.query(
        `UPDATE ${table} SET status = 'completed' WHERE booking_id = ?`,
        [booking_id]
      );
    } catch (_) {}

    // Simulate refund processing (in production → call payment gateway API)
    await db.query(
      `UPDATE Refund SET
        refund_status       = 'processing',
        refund_processed_at = NOW()
       WHERE refund_id = ?`,
      [refundId]
    );

    return res.status(200).json({
      message:      calc.refund_amount > 0
        ? `✅ Refund of Rs. ${calc.refund_amount} initiated!`
        : '⚠️ No refund applicable based on vehicle condition.',
      refund_id:    refundId,
      verdict:      calc.verdict,
      breakdown:    calc.breakdown,
      refund:       calc,
      refund_method: refundMethod,
    });

  } catch (error) {
    console.error('processVehicleReturn error:', error);
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ════════════════════════════════════════════════
// GET /api/refunds/status/:booking_id
// Passenger checks refund status
// ════════════════════════════════════════════════
const getRefundStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const passenger_id   = req.user.id;

    const [rows] = await db.query(
      `SELECT * FROM Refund
       WHERE booking_id = ? AND passenger_id = ?
       LIMIT 1`,
      [booking_id, passenger_id]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        found:   false,
        message: 'Vehicle not yet returned or refund not processed.',
        status:  'pending',
      });
    }

    const r = rows[0];
    return res.status(200).json({
      found:          true,
      refund_id:      r.refund_id,
      deposit_amount: r.deposit_amount,
      refund_amount:  r.refund_amount,
      refund_status:  r.refund_status,
      refund_method:  r.refund_method,
      total_deductions: r.total_deductions,
      deductions: {
        late_fee:     r.late_fee_deduction,
        damage:       r.damage_deduction,
        cleaning:     r.cleaning_deduction,
        fuel:         r.fuel_deduction,
        accessories:  r.accessories_deduction,
      },
      return_condition:   r.return_condition,
      late_hours:         r.late_hours,
      damage_description: r.damage_description,
      vehicle_returned_at: r.vehicle_returned_at,
      refund_processed_at: r.refund_processed_at,
    });

  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ════════════════════════════════════════════════
// GET /api/refunds/my-refunds
// Passenger gets all their refunds
// ════════════════════════════════════════════════
const getMyRefunds = async (req, res) => {
  try {
    const passenger_id = req.user.id;
    const [rows] = await db.query(
      `SELECT r.*, 
        COALESCE(bwd.pickup_location, bwod.self_pickup_location) AS pickup_location
       FROM Refund r
       LEFT JOIN BookingWithDriver bwd
         ON r.booking_id = bwd.booking_id AND r.booking_type = 'with-driver'
       LEFT JOIN BookingWithoutDriver bwod
         ON r.booking_id = bwod.booking_id AND r.booking_type = 'without-driver'
       WHERE r.passenger_id = ?
       ORDER BY r.created_at DESC`,
      [passenger_id]
    );
    return res.status(200).json({ refunds: rows, count: rows.length });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ════════════════════════════════════════════════
// GET /api/refunds/all  (admin only)
// ════════════════════════════════════════════════
const getAllRefunds = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, p.name AS passenger_name, p.phone AS passenger_phone
      FROM Refund r
      LEFT JOIN Passenger p ON r.passenger_id = p.passenger_id
      ORDER BY r.created_at DESC
    `);
    return res.status(200).json({ refunds: rows, total: rows.length });
  } catch (error) {
    return res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  processVehicleReturn,
  getRefundStatus,
  getMyRefunds,
  getAllRefunds,
};