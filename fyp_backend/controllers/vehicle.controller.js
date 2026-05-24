const db = require('../config/db');

// ==================== GET ALL VEHICLES ====================
const getAllVehicles = async (req, res) => {
  try {
    const [vehicles] = await db.query(`
      SELECT v.*, vt.type_name 
      FROM Vehicle v
      JOIN VehicleType vt ON v.vehicle_type_id = vt.vehicle_type_id
      WHERE v.availability = 'available'
    `);

    res.status(200).json({
      message: '✅ Vehicles fetched successfully!',
      total: vehicles.length,
      vehicles
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET SINGLE VEHICLE ====================
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT v.*, vt.type_name 
      FROM Vehicle v
      JOIN VehicleType vt ON v.vehicle_type_id = vt.vehicle_type_id
      WHERE v.vehicle_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Vehicle not found!' });
    }

    res.status(200).json({
      message: '✅ Vehicle fetched successfully!',
      vehicle: rows[0]
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== ADD VEHICLE (ADMIN) ====================
const addVehicle = async (req, res) => {
  try {
    const {
      reg_number, vehicle_type_id, model,
      color, year, fare_per_hour,
      fare_per_km, fare_per_day
    } = req.body;

    // Check if reg number already exists
    const [existing] = await db.query(
      'SELECT * FROM Vehicle WHERE reg_number = ?', [reg_number]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '❌ Vehicle already registered!' });
    }

    await db.query(`
      INSERT INTO Vehicle 
      (reg_number, vehicle_type_id, model, color, year, availability, fare_per_hour, fare_per_km, fare_per_day)
      VALUES (?, ?, ?, ?, ?, 'available', ?, ?, ?)
    `, [reg_number, vehicle_type_id, model, color, year, fare_per_hour, fare_per_km, fare_per_day]);

    res.status(201).json({ message: '✅ Vehicle added successfully!' });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== UPDATE VEHICLE (ADMIN) ====================
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { model, color, availability, fare_per_hour, fare_per_km, fare_per_day } = req.body;

    await db.query(`
      UPDATE Vehicle 
      SET model = ?, color = ?, availability = ?, 
          fare_per_hour = ?, fare_per_km = ?, fare_per_day = ?
      WHERE vehicle_id = ?
    `, [model, color, availability, fare_per_hour, fare_per_km, fare_per_day, id]);

    res.status(200).json({ message: '✅ Vehicle updated successfully!' });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};
// ==================== GET AVAILABLE DRIVERS ====================
const getAvailableDrivers = async (req, res) => {
  try {
    const [drivers] = await db.query(`
      SELECT driver_id, name, phone, email, 
             rating, experience_years, availability_status
      FROM Driver 
      WHERE availability_status = 'available'
    `);

    res.status(200).json({
      message: '✅ Available drivers fetched!',
      total: drivers.length,
      drivers
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};
// ==================== DELETE VEHICLE (ADMIN) ====================
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM Vehicle WHERE vehicle_id = ?', [id]);

    res.status(200).json({ message: '✅ Vehicle deleted successfully!' });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const [drivers] = await db.query(
      'SELECT driver_id, name, email, phone, license_number, availability_status, status, created_at FROM Driver ORDER BY created_at DESC'
    );
    res.status(200).json({ message: '✅ Drivers fetched!', drivers });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableDrivers,
  getAllDrivers  // ← Yeh add karo
};