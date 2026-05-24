const express = require('express');
const router = express.Router();

const {
  getAllVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicle.controller');

const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Public Routes — koi bhi dekh sakta hai
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);

// Admin Only Routes — sirf admin kar sakta hai
router.post('/add', verifyAdmin, addVehicle);
router.put('/update/:id', verifyAdmin, updateVehicle);
router.delete('/delete/:id', verifyAdmin, deleteVehicle);

module.exports = router;