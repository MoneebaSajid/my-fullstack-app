// const bcrypt = require('bcryptjs');
// const jwt    = require('jsonwebtoken');
// const db     = require('../config/db');
// const multer = require('multer');       // ← ADD
// const path   = require('path');         // ← ADD
// const fs     = require('fs');           // ← ADD

// // ─── Multer — file upload config ──────────────────────────────────────────────
// const uploadDir = path.join(__dirname, '..', 'uploads', 'drivers');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename:    (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
//   allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG/PNG allowed'));
// };

// const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// // ==================== PASSENGER REGISTER ====================
// const registerPassenger = async (req, res) => {
//   try {
//     const { name, email, phone, password, address, cnic, date_of_birth, gender, nationality } = req.body;

//     const [existing] = await db.query('SELECT * FROM Passenger WHERE email = ?', [email]);
//     if (existing.length > 0) {
//       return res.status(400).json({ message: '❌ Email already registered!' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await db.query(
//       `INSERT INTO Passenger (name, email, phone, password, address, cnic, date_of_birth, gender, nationality, status, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
//       [name, email, phone, hashedPassword, address, cnic, date_of_birth, gender, nationality]
//     );

//     res.status(201).json({ message: '✅ Passenger registered successfully!' });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// // ==================== PASSENGER LOGIN ====================
// const loginPassenger = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const [rows] = await db.query('SELECT * FROM Passenger WHERE email = ?', [email]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: '❌ Passenger not found!' });
//     }

//     const passenger = rows[0];

//     const isMatch = await bcrypt.compare(password, passenger.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: '❌ Wrong password!' });
//     }

//     const token = jwt.sign(
//       { id: passenger.passenger_id, role: 'passenger' },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(200).json({
//       message: '✅ Login successful!',
//       token,
//       user: {
//         id: passenger.passenger_id,
//         name: passenger.name,
//         email: passenger.email,
//         role: 'passenger'
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// // ==================== ADMIN LOGIN ====================
// const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const [rows] = await db.query('SELECT * FROM Admin WHERE email = ?', [email]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: '❌ Admin not found!' });
//     }

//     const admin = rows[0];

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: '❌ Wrong password!' });
//     }

//     const token = jwt.sign(
//       { id: admin.admin_id, role: 'admin' },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(200).json({
//       message: '✅ Admin login successful!',
//       token,
//       user: {
//         id: admin.admin_id,
//         name: admin.name,
//         email: admin.email,
//         role: 'admin'
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };
// // ==================== ADMIN REGISTER ====================
// const registerAdmin = async (req, res) => {
//   try {
//     const {
//       name, email, phone, password,
//       role, profile_picture
//     } = req.body;

//     const [existing] = await db.query(
//       'SELECT * FROM Admin WHERE email = ?', [email]
//     );
//     if (existing.length > 0) {
//       return res.status(400).json({ message: '❌ Email already registered!' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await db.query(`
//       INSERT INTO Admin 
//       (name, email, password, role, phone, status, created_at)
//       VALUES (?, ?, ?, ?, ?, 'active', NOW())
//     `, [name, email, hashedPassword, role || 'admin', phone]);

//     res.status(201).json({
//       message: '✅ Admin registered successfully!'
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };
// // ==================== DRIVER LOGIN ====================
// const loginDriver = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const [rows] = await db.query('SELECT * FROM Driver WHERE email = ?', [email]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: '❌ Driver not found!' });
//     }

//     const driver = rows[0];

//     const isMatch = await bcrypt.compare(password, driver.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: '❌ Wrong password!' });
//     }

//     const token = jwt.sign(
//       { id: driver.driver_id, role: 'driver' },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(200).json({
//       message: '✅ Driver login successful!',
//       token,
//       user: {
//         id: driver.driver_id,
//         name: driver.name,
//         email: driver.email,
//         role: 'driver'
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// // ==================== OWNER LOGIN ====================
// const loginOwner = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const [rows] = await db.query('SELECT * FROM Owner WHERE email = ?', [email]);
//     if (rows.length === 0) {
//       return res.status(404).json({ message: '❌ Owner not found!' });
//     }

//     const owner = rows[0];

//     const isMatch = await bcrypt.compare(password, owner.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: '❌ Wrong password!' });
//     }

//     const token = jwt.sign(
//       { id: owner.owner_id, role: 'owner' },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(200).json({
//       message: '✅ Owner login successful!',
//       token,
//       user: {
//         id: owner.owner_id,
//         name: owner.name,
//         email: owner.email,
//         role: 'owner'
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: '❌ Server error', error: error.message });
//   }
// };

// // ==================== DRIVER REGISTER (3-step form with documents) ====================
// const driverRegister = async (req, res) => {
//   try {
//     const {
//       first_name, last_name, phone, email, password,
//       gender, dob, license_number, license_expiry, cnic_number,
//       vehicle_model, vehicle_plate, vehicle_year, vehicle_color,
//     } = req.body;

//     // 1. Basic field check
//     if (!first_name || !last_name || !phone || !email || !password ||
//         !gender || !dob || !license_number || !license_expiry || !cnic_number) {
//       return res.status(400).json({ message: 'All required fields must be filled.' });
//     }

//     // 2. File check
//     const { profile_photo, cnic_front, cnic_back, license_photo } = req.files || {};
//     if (!cnic_front || !cnic_back || !license_photo) {
//       return res.status(400).json({ message: 'CNIC (both sides) and license photo are required.' });
//     }

//     // 3. Duplicate check — use db.query() not db.promise().query()
//     const [existing] = await db.query(
//       'SELECT driver_id FROM Driver WHERE email = ? OR phone = ?',
//       [email.toLowerCase(), phone]
//     );
//     if (existing.length > 0) {
//       return res.status(409).json({ message: 'A driver with this email or phone already exists.' });
//     }

//     // 4. Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 5. File paths
//     const profilePhotoPath = profile_photo ? profile_photo[0].filename : null;
//     const cnicFrontPath    = cnic_front[0].filename;
//     const cnicBackPath     = cnic_back[0].filename;
//     const licensePhotoPath = license_photo[0].filename;

//     // 6. Insert into Driver table
//     const [driverResult] = await db.query(
//       `INSERT INTO Driver
//         (name, email, phone, password, gender, date_of_birth,
//          license_number, license_expiry, profile_photo,
//          availability_status, status, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unavailable', 'pending', NOW())`,
//       [
//         `${first_name.trim()} ${last_name.trim()}`,
//         email.trim().toLowerCase(),
//         phone.trim(),
//         hashedPassword,
//         gender,
//         dob,
//         license_number.trim(),
//         license_expiry,
//         profilePhotoPath,
//       ]
//     );

//     const driverId = driverResult.insertId;

//     // 7. Insert into Driver_Documents table
//     await db.query(
//       `INSERT INTO Driver_Documents
//         (driver_id, cnic_number, cnic_front, cnic_back, license_photo)
//        VALUES (?, ?, ?, ?, ?)`,
//       [driverId, cnic_number.trim(), cnicFrontPath, cnicBackPath, licensePhotoPath]
//     );

//     // 8. Optional vehicle info
//     if (vehicle_model && vehicle_plate) {
//       await db.query(
//         `INSERT INTO Vehicle
//           (driver_id, model, plate_number, year, color, status)
//          VALUES (?, ?, ?, ?, ?, 'pending')`,
//         [driverId, vehicle_model, vehicle_plate, vehicle_year || null, vehicle_color || null]
//       );
//     }

//     // 9. Success — account is pending, no token issued yet
//     return res.status(201).json({
//       message: 'Registration submitted successfully. Your account is under review.',
//       driver_id: driverId,
//     });

//   } catch (err) {
//     console.error('Driver register error:', err);
//     return res.status(500).json({ message: 'Server error. Please try again.' });
//   }
// };

// // ==================== EXPORTS ====================
// module.exports = {
//   registerPassenger,
//   loginPassenger,
//   loginDriver,
//   loginAdmin,
//   loginOwner,
//   Registerdriver,
//   RegisterAdmin,
//   upload,
// };
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==================== PASSENGER REGISTER ====================
const registerPassenger = async (req, res) => {
  try {
    const {
      name, email, phone, password,
      address, cnic, date_of_birth,
      gender, nationality
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM Passenger WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '❌ Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(`
      INSERT INTO Passenger 
      (name, email, phone, password, address, cnic, 
       date_of_birth, gender, nationality, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `, [name, email, phone, hashedPassword, address,
        cnic, date_of_birth, gender, nationality]);

    res.status(201).json({ message: '✅ Passenger registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== PASSENGER LOGIN ====================
const loginPassenger = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM Passenger WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Passenger not found!' });
    }

    const passenger = rows[0];
    const isMatch = await bcrypt.compare(password, passenger.password);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Wrong password!' });
    }

    const token = jwt.sign(
      { id: passenger.passenger_id, role: 'passenger' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: '✅ Login successful!',
      token,
      user: {
        id: passenger.passenger_id,
        name: passenger.name,
        email: passenger.email,
        role: 'passenger'
      }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== DRIVER REGISTER ====================
const registerDriver = async (req, res) => {
  try {
    const {
      name, email, phone, password,
      address, cnic, date_of_birth,
      gender, nationality, license_number
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM Driver WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '❌ Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(`
      INSERT INTO Driver 
      (name, email, phone, password, address, date_of_birth,
       cnic, license_number, availability_status, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', 'active', NOW())
    `, [name, email, phone, hashedPassword, address,
        date_of_birth, cnic, license_number || 'PENDING']);

    res.status(201).json({ message: '✅ Driver registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== DRIVER LOGIN ====================
const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM Driver WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Driver not found!' });
    }

    const driver = rows[0];
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Wrong password!' });
    }

    const token = jwt.sign(
      { id: driver.driver_id, role: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: '✅ Driver login successful!',
      token,
      user: {
        id: driver.driver_id,
        name: driver.name,
        email: driver.email,
        role: 'driver'
      }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== ADMIN REGISTER ====================
const registerAdmin = async (req, res) => {
  try {
    const {
      name, email, phone, password, role
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM Admin WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '❌ Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(`
      INSERT INTO Admin 
      (name, email, password, role, phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', NOW())
    `, [name, email, hashedPassword, role || 'admin', phone]);

    res.status(201).json({ message: '✅ Admin registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== ADMIN LOGIN ====================
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM Admin WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Admin not found!' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Wrong password!' });
    }

    const token = jwt.sign(
      { id: admin.admin_id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: '✅ Admin login successful!',
      token,
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// ==================== OWNER LOGIN ====================
const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM Owner WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '❌ Owner not found!' });
    }

    const owner = rows[0];
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Wrong password!' });
    }

    const token = jwt.sign(
      { id: owner.owner_id, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: '✅ Owner login successful!',
      token,
      user: {
        id: owner.owner_id,
        name: owner.name,
        email: owner.email,
        role: 'owner'
      }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

module.exports = {
  registerPassenger,
  loginPassenger,
  registerDriver,
  loginDriver,
  registerAdmin,
  loginAdmin,
  loginOwner
};