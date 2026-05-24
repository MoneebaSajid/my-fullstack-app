const db = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const passenger_id = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM Passenger WHERE passenger_id = ?', [passenger_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Passenger not found!' });
    }
    const passenger = rows[0];
    delete passenger.password;
    res.status(200).json({ message: '✅ Profile fetched!', passenger });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const passenger_id = req.user.id;
    const { name, phone, address, nationality, gender } = req.body;
    await db.query(`
      UPDATE Passenger 
      SET name = ?, phone = ?, address = ?, nationality = ?, gender = ?
      WHERE passenger_id = ?
    `, [name, phone, address, nationality, gender, passenger_id]);
    res.status(200).json({ message: '✅ Profile updated!' });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

const getAllPassengers = async (req, res) => {
  try {
    const [passengers] = await db.query(
      'SELECT passenger_id, name, email, phone, status, created_at FROM Passenger ORDER BY created_at DESC'
    );
    res.status(200).json({ message: '✅ Passengers fetched!', passengers });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, getAllPassengers };