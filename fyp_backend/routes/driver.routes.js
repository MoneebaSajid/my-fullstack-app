const express = require('express');
const router = express.Router();
const { getAvailableDrivers, getAllDrivers } = require('../controllers/vehicle.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

router.get('/available', verifyToken, getAvailableDrivers);
router.get('/all', verifyAdmin, getAllDrivers);

module.exports = router;