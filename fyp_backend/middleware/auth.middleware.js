const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: '❌ No token provided!' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: '❌ Invalid or expired token!' });
      }
      req.user = decoded;
      next();
    });

  } catch (error) {
    res.status(500).json({ message: '❌ Server error', error: error.message });
  }
};

// Role based access
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    console.log('User role:', req.user); // Debug line
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: '❌ Admin access only!' });
    }
  });
};

const verifyPassenger = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'passenger') {
      next();
    } else {
      res.status(403).json({ message: '❌ Passenger access only!' });
    }
  });
};

const verifyDriver = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'driver') {
      next();
    } else {
      res.status(403).json({ message: '❌ Driver access only!' });
    }
  });
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyPassenger,
  verifyDriver
};