// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('../config/db');

// const router = express.Router();

// // ===== DRIVER REGISTRATION =====
// router.post('/register-driver', async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       password,
//       licenseNumber,
//       licenseExpiry,
//       vehicleNumber,
//       vehicleModel,
//       vehicleColor,
//     } = req.body;

//     // Validate required fields
//     if (
//       !firstName ||
//       !lastName ||
//       !email ||
//       !phone ||
//       !password ||
//       !licenseNumber ||
//       !licenseExpiry ||
//       !vehicleNumber ||
//       !vehicleModel ||
//       !vehicleColor
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required',
//       });
//     }

//     // Check if driver already exists
//     const [existingDriver] = await db.query(
//       'SELECT * FROM Driver WHERE email = ? OR phone = ?',
//       [email, phone]
//     );

//     if (existingDriver.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email or phone number already registered',
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create driver
//     await db.query(
//       `INSERT INTO Driver 
//        (firstName, lastName, email, phone, password, licenseNumber, licenseExpiry, status)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         firstName,
//         lastName,
//         email,
//         phone,
//         hashedPassword,
//         licenseNumber,
//         licenseExpiry,
//         'pending', // Drivers start as pending for verification
//       ]
//     );

//     // Get the created driver ID
//     const [driver] = await db.query('SELECT driver_id FROM Driver WHERE email = ?', [
//       email,
//     ]);

//     const driverId = driver[0].driver_id;

//     // Add vehicle information
//     await db.query(
//       `INSERT INTO Vehicle 
//        (driverId, vehicleNumber, vehicleModel, vehicleColor, status)
//        VALUES (?, ?, ?, ?, ?)`,
//       [driverId, vehicleNumber, vehicleModel, vehicleColor, 'pending']
//     );

//     return res.status(201).json({
//       success: true,
//       message:
//         'Driver registered successfully. Your account is pending verification.',
//       driver_id: driverId,
//     });
//   } catch (error) {
//     console.error('Driver Registration Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred during registration',
//       error: error.message,
//     });
//   }
// });

// // ===== DRIVER LOGIN =====
// router.post('/driver-login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validate input
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email and password are required',
//       });
//     }

//     // Check if driver exists
//     const [drivers] = await db.query('SELECT * FROM Driver WHERE email = ?', [email]);

//     if (drivers.length === 0) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password',
//       });
//     }

//     const driver = drivers[0];

//     // Check if driver is verified
//     if (driver.status === 'pending') {
//       return res.status(403).json({
//         success: false,
//         message: 'Your account is pending verification. Please wait for admin approval.',
//       });
//     }

//     if (driver.status === 'rejected') {
//       return res.status(403).json({
//         success: false,
//         message:
//           'Your account has been rejected. Please contact support for more information.',
//       });
//     }

//     // Verify password
//     const isPasswordCorrect = await bcrypt.compare(password, driver.password);

//     if (!isPasswordCorrect) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password',
//       });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { driver_id: driver.driver_id, email: driver.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     // Get vehicle information
//     const [vehicles] = await db.query(
//       'SELECT * FROM Vehicle WHERE driverId = ? LIMIT 1',
//       [driver.driver_id]
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       driver: {
//         driver_id: driver.driver_id,
//         firstName: driver.firstName,
//         lastName: driver.lastName,
//         email: driver.email,
//         phone: driver.phone,
//         licenseNumber: driver.licenseNumber,
//         licenseExpiry: driver.licenseExpiry,
//         status: driver.status,
//         vehicle: vehicles[0] || null,
//       },
//     });
//   } catch (error) {
//     console.error('Driver Login Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred during login',
//       error: error.message,
//     });
//   }
// });

// // ===== PASSENGER REGISTRATION =====
// router.post('/passenger-register', async (req, res) => {
//   try {
//     const { firstName, lastName, email, phone, password } = req.body;

//     // Validate required fields
//     if (!firstName || !lastName || !email || !phone || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required',
//       });
//     }

//     // Check if passenger already exists
//     const [existingPassenger] = await db.query(
//       'SELECT * FROM Passenger WHERE email = ? OR phone = ?',
//       [email, phone]
//     );

//     if (existingPassenger.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email or phone number already registered',
//       });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create passenger
//     await db.query(
//       `INSERT INTO Passenger (firstName, lastName, email, phone, password)
//        VALUES (?, ?, ?, ?, ?)`,
//       [firstName, lastName, email, phone, hashedPassword]
//     );

//     // Get the created passenger ID
//     const [passenger] = await db.query('SELECT passenger_id FROM Passenger WHERE email = ?', [
//       email,
//     ]);

//     return res.status(201).json({
//       success: true,
//       message: 'Passenger registered successfully',
//       passenger_id: passenger[0].passenger_id,
//     });
//   } catch (error) {
//     console.error('Passenger Registration Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred during registration',
//       error: error.message,
//     });
//   }
// });

// // ===== PASSENGER LOGIN =====
// router.post('/passenger-login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validate input
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email and password are required',
//       });
//     }

//     // Check if passenger exists
//     const [passengers] = await db.query('SELECT * FROM Passenger WHERE email = ?', [email]);

//     if (passengers.length === 0) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password',
//       });
//     }

//     const passenger = passengers[0];

//     // Verify password
//     const isPasswordCorrect = await bcrypt.compare(password, passenger.password);

//     if (!isPasswordCorrect) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password',
//       });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { passenger_id: passenger.passenger_id, email: passenger.email },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       passenger: {
//         passenger_id: passenger.passenger_id,
//         firstName: passenger.firstName,
//         lastName: passenger.lastName,
//         email: passenger.email,
//         phone: passenger.phone,
//       },
//     });
//   } catch (error) {
//     console.error('Passenger Login Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'An error occurred during login',
//       error: error.message,
//     });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();

const {
  registerPassenger,
  loginPassenger,
  loginAdmin,
  loginDriver,
  loginOwner,
  registerDriver,
  registerAdmin
} = require('../controllers/auth.controller');

// ── Passenger Routes ──
router.post('/passenger/register', registerPassenger);
router.post('/passenger/login', loginPassenger);

// ── Driver Routes ──
router.post('/driver/register', registerDriver);
router.post('/driver/login', loginDriver);

// ── Admin Routes ──
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// ── Owner Routes ──
router.post('/owner/login', loginOwner);

module.exports = router;