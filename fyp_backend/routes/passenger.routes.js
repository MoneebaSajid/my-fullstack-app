const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllPassengers } = require('../controllers/passenger.controller');
const { verifyPassenger, verifyAdmin } = require('../middleware/auth.middleware');

router.get('/profile', verifyPassenger, getProfile);
router.put('/profile', verifyPassenger, updateProfile);
router.get('/all', verifyAdmin, getAllPassengers);

module.exports = router;