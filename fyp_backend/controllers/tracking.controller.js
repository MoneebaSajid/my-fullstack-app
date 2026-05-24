const db = require('../config/db');
// ==================== GET ALL DRIVERS LIVE LOCATIONS ====================
const getAllDriversLocations = async (req, res) => {
  try {
    const [drivers] = await db.query(`
      SELECT 
        d.driver_id,
        d.name,
        d.phone,
        d.rating,
        d.availability_status,
        d.current_latitude,
        d.current_longitude,
        v.model,
        v.reg_number,
        v.vehicle_type_id
      FROM Driver d
      LEFT JOIN Vehicle v ON d.vehicle_id = v.vehicle_id
      WHERE d.current_latitude IS NOT NULL
      AND d.current_longitude IS NOT NULL
    `);

    res.status(200).json({
      message: '✅ All drivers locations fetched!',
      total: drivers.length,
      drivers
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET NEAREST DRIVERS ====================
const getNearestDrivers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: '❌ Latitude and longitude required!' });
    }

    const [drivers] = await db.query(`
      SELECT 
        d.driver_id,
        d.name,
        d.phone,
        d.rating,
        d.availability_status,
        d.current_latitude,
        d.current_longitude,
        v.model,
        v.reg_number,
        v.fare_per_hour,
        v.fare_per_day,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(d.current_latitude)) *
            cos(radians(d.current_longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(d.current_latitude))
          )
        ) AS distance_km
      FROM Driver d
      LEFT JOIN Vehicle v ON d.vehicle_id = v.vehicle_id
      WHERE d.current_latitude IS NOT NULL
      AND d.current_longitude IS NOT NULL
      AND d.availability_status = 'available'
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
      LIMIT 10
    `, [latitude, longitude, latitude, radius]);

    res.status(200).json({
      message: '✅ Nearest drivers fetched!',
      total: drivers.length,
      drivers
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};
// ==================== UPDATE DRIVER LOCATION ====================
const updateDriverLocation = async (req, res) => {
  try {
    const {
      vehicle_id,
      booking_id,
      latitude,
      longitude,
      speed,
      heading,
      accuracy
    } = req.body;

    const driver_id = req.user.id;

    // Save location to database
    await db.query(`
      INSERT INTO Driver_Location 
      (driver_id, vehicle_id, booking_id, latitude, longitude, 
       speed, heading, accuracy, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [driver_id, vehicle_id || null, booking_id || null,
        latitude, longitude, speed || 0, heading || 0, accuracy || 0]);

    // Update driver's current location in Driver table
    await db.query(`
      UPDATE Driver 
      SET current_latitude = ?, current_longitude = ?
      WHERE driver_id = ?
    `, [latitude, longitude, driver_id]);

    res.status(200).json({
      message: '✅ Location updated successfully!',
      latitude,
      longitude
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET DRIVER LOCATION (PASSENGER) ====================
const getDriverLocation = async (req, res) => {
  try {
    const { driver_id } = req.params;

    const [driver] = await db.query(`
      SELECT name, current_latitude, current_longitude, 
             availability_status, phone
      FROM Driver 
      WHERE driver_id = ?
    `, [driver_id]);

    if (driver.length === 0) {
      return res.status(404).json({ message: '❌ Driver not found!' });
    }

    if (!driver[0].current_latitude) {
      return res.status(404).json({ message: '❌ Driver location not available!' });
    }

    res.status(200).json({
      message: '✅ Driver location fetched!',
      driver: {
        name: driver[0].name,
        phone: driver[0].phone,
        latitude: driver[0].current_latitude,
        longitude: driver[0].current_longitude,
        status: driver[0].availability_status
      }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET LOCATION HISTORY ====================
const getLocationHistory = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const [history] = await db.query(`
      SELECT dl.*, d.name as driver_name
      FROM Driver_Location dl
      JOIN Driver d ON dl.driver_id = d.driver_id
      WHERE dl.booking_id = ?
      ORDER BY dl.timestamp ASC
    `, [booking_id]);

    res.status(200).json({
      message: '✅ Location history fetched!',
      total: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};
module.exports = {
  updateDriverLocation,
  getDriverLocation,
  getLocationHistory,
  getAllDriversLocations,  // ← Add
  getNearestDrivers        // ← Add
};