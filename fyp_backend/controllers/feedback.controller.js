const db = require('../config/db');

// ==================== SUBMIT FEEDBACK ====================
const submitFeedback = async (req, res) => {
  try {
    const {
      booking_with_driver_id,
      booking_without_driver_id,
      driver_id,
      rating,
      comments,
      feedback_type
    } = req.body;

    const passenger_id = req.user.id;

    await db.query(`
      INSERT INTO Feedback 
      (booking_with_driver_id, booking_without_driver_id, passenger_id,
       driver_id, rating, comments, feedback_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      booking_with_driver_id || null,
      booking_without_driver_id || null,
      passenger_id,
      driver_id || null,
      rating,
      comments,
      feedback_type
    ]);

    res.status(201).json({
      message: '✅ Feedback submitted successfully!'
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET MY FEEDBACK ====================
const getMyFeedback = async (req, res) => {
  try {
    const passenger_id = req.user.id;

    const [feedback] = await db.query(`
      SELECT f.*, d.name as driver_name
      FROM Feedback f
      LEFT JOIN Driver d ON f.driver_id = d.driver_id
      WHERE f.passenger_id = ?
      ORDER BY f.created_at DESC
    `, [passenger_id]);

    res.status(200).json({
      message: '✅ Feedback fetched successfully!',
      total: feedback.length,
      feedback
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== GET ALL FEEDBACK (ADMIN) ====================
const getAllFeedback = async (req, res) => {
  try {
    const [feedback] = await db.query(`
      SELECT f.*, 
             p.name as passenger_name,
             d.name as driver_name
      FROM Feedback f
      LEFT JOIN Passenger p ON f.passenger_id = p.passenger_id
      LEFT JOIN Driver d ON f.driver_id = d.driver_id
      ORDER BY f.created_at DESC
    `);

    res.status(200).json({
      message: '✅ All feedback fetched!',
      total: feedback.length,
      feedback
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getAllFeedback
};