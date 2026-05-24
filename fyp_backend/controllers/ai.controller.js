const db = require('../config/db');

// ==================== DYNAMIC PRICING ====================
const getDynamicPrice = async (req, res) => {
  try {
    const { vehicle_id, start_time, end_time, rate_type } = req.body;

    // Get vehicle base price
    const [vehicle] = await db.query(
      'SELECT * FROM Vehicle WHERE vehicle_id = ?', [vehicle_id]
    );
    if (vehicle.length === 0) {
      return res.status(404).json({ message: '❌ Vehicle not found!' });
    }

    const v = vehicle[0];
    let basePrice = 0;

    // Calculate base price
    const start = new Date(start_time);
    const end = new Date(end_time);

    if (rate_type === 'hourly') {
      const hours = Math.ceil((end - start) / (1000 * 60 * 60));
      basePrice = hours * v.fare_per_hour;
    } else if (rate_type === 'daily') {
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      basePrice = days * v.fare_per_day;
    }

    // AI Pricing Factors
    const hour = start.getHours();
    let demandMultiplier = 1.0;
    let reason = [];

    // Peak hours — morning & evening
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      demandMultiplier += 0.3;
      reason.push('Peak hours (+30%)');
    }

    // Weekend pricing
    const day = start.getDay();
    if (day === 0 || day === 6) {
      demandMultiplier += 0.2;
      reason.push('Weekend (+20%)');
    }

    // Check demand — how many bookings today
    const [bookings] = await db.query(`
      SELECT COUNT(*) as total FROM BookingWithDriver 
      WHERE DATE(booking_date) = CURDATE()
    `);
    const todayBookings = bookings[0].total;

    if (todayBookings > 10) {
      demandMultiplier += 0.25;
      reason.push('High demand (+25%)');
    } else if (todayBookings > 5) {
      demandMultiplier += 0.1;
      reason.push('Moderate demand (+10%)');
    }

    // Calculate final price
    const finalPrice = Math.round(basePrice * demandMultiplier);
    const savings = finalPrice - basePrice;

    res.status(200).json({
      message: '✅ Dynamic price calculated!',
      base_price: basePrice,
      demand_multiplier: demandMultiplier,
      final_price: finalPrice,
      extra_charges: savings,
      pricing_reasons: reason,
      currency: 'PKR'
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== VEHICLE RECOMMENDATION ====================
const getVehicleRecommendation = async (req, res) => {
  try {
    const { passengers, trip_type, budget_per_day, need_driver } = req.body;

    // Get all available vehicles
    const [vehicles] = await db.query(`
      SELECT v.*, vt.type_name 
      FROM Vehicle v
      JOIN VehicleType vt ON v.vehicle_type_id = vt.vehicle_type_id
      WHERE v.availability = 'available'
    `);

    let recommended = vehicles;

    // Filter by budget
    if (budget_per_day) {
      recommended = recommended.filter(v => v.fare_per_day <= budget_per_day);
    }

    // Filter by trip type
    if (trip_type === 'family') {
      recommended = recommended.filter(v =>
        v.type_name.toLowerCase().includes('suv') ||
        v.type_name.toLowerCase().includes('van') ||
        v.type_name.toLowerCase().includes('mini')
      );
    } else if (trip_type === 'business') {
      recommended = recommended.filter(v =>
        v.type_name.toLowerCase().includes('luxury') ||
        v.type_name.toLowerCase().includes('sedan') ||
        v.type_name.toLowerCase().includes('corporate')
      );
    } else if (trip_type === 'economy') {
      recommended = recommended.filter(v =>
        v.type_name.toLowerCase().includes('economy') ||
        v.type_name.toLowerCase().includes('compact') ||
        v.type_name.toLowerCase().includes('hatchback')
      );
    } else if (trip_type === 'wedding') {
      recommended = recommended.filter(v =>
        v.type_name.toLowerCase().includes('wedding') ||
        v.type_name.toLowerCase().includes('luxury') ||
        v.type_name.toLowerCase().includes('convertible')
      );
    }

    // Sort by fare
    recommended.sort((a, b) => a.fare_per_day - b.fare_per_day);

    // Top 3 recommendations
    const top3 = recommended.slice(0, 3);

    if (top3.length === 0) {
      return res.status(404).json({
        message: '❌ No vehicles found matching your criteria!'
      });
    }

    res.status(200).json({
      message: '✅ Vehicle recommendations ready!',
      total_found: recommended.length,
      top_recommendations: top3,
      filters_applied: { trip_type, budget_per_day, passengers }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== FRAUD DETECTION ====================
const detectFraud = async (req, res) => {
  try {
    const passenger_id = req.user.id;

    // Check bookings in last 24 hours
    const [recentBookings] = await db.query(`
      SELECT COUNT(*) as total FROM BookingWithDriver
      WHERE passenger_id = ? 
      AND created_at >= NOW() - INTERVAL 24 HOUR
    `, [passenger_id]);

    const bookingCount = recentBookings[0].total;
    let fraudScore = 0;
    let flags = [];

    // Flag 1: Too many bookings
    if (bookingCount > 5) {
      fraudScore += 40;
      flags.push('Too many bookings in 24 hours');
    }

    // Flag 2: Check cancelled bookings
    const [cancelled] = await db.query(`
      SELECT COUNT(*) as total FROM BookingWithDriver
      WHERE passenger_id = ? AND status = 'cancelled'
    `, [passenger_id]);

    if (cancelled[0].total > 3) {
      fraudScore += 30;
      flags.push('Multiple cancelled bookings');
    }

    // Flag 3: Check payment failures
    const [failedPayments] = await db.query(`
      SELECT COUNT(*) as total FROM Payment
      WHERE passenger_id = ? AND payment_status = 'failed'
    `, [passenger_id]);

    if (failedPayments[0].total > 2) {
      fraudScore += 30;
      flags.push('Multiple failed payments');
    }

    // Determine risk level
    let riskLevel = 'low';
    if (fraudScore >= 70) riskLevel = 'high';
    else if (fraudScore >= 40) riskLevel = 'medium';

    res.status(200).json({
      message: '✅ Fraud analysis complete!',
      passenger_id,
      fraud_score: fraudScore,
      risk_level: riskLevel,
      flags,
      recommendation: riskLevel === 'high'
        ? '⚠️ Block this user immediately!'
        : riskLevel === 'medium'
        ? '⚠️ Monitor this user closely!'
        : '✅ User seems legitimate!'
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== DEMAND PREDICTION ====================
const getDemandPrediction = async (req, res) => {
  try {
    // Get bookings by hour
    const [hourlyData] = await db.query(`
      SELECT HOUR(booking_date) as hour, COUNT(*) as bookings
      FROM BookingWithDriver
      GROUP BY HOUR(booking_date)
      ORDER BY hour
    `);

    // Get bookings by day
    const [dailyData] = await db.query(`
      SELECT DAYNAME(booking_date) as day, COUNT(*) as bookings
      FROM BookingWithDriver
      GROUP BY DAYNAME(booking_date)
      ORDER BY bookings DESC
    `);

    // Peak hours
    const peakHours = hourlyData
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3);

    // Peak days
    const peakDays = dailyData.slice(0, 3);

    res.status(200).json({
      message: '✅ Demand prediction ready!',
      peak_hours: peakHours,
      peak_days: peakDays,
      hourly_breakdown: hourlyData,
      daily_breakdown: dailyData,
      insight: '📊 Use this data to allocate more vehicles during peak times!'
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  getDynamicPrice,
  getVehicleRecommendation,
  detectFraud,
  getDemandPrediction
};