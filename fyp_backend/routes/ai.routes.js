const express = require('express');
const router = express.Router();

const {
  getDynamicPrice,
  getVehicleRecommendation,
  detectFraud,
  getDemandPrediction
} = require('../controllers/ai.controller');

const {
  verifyToken,
  verifyAdmin,
  verifyPassenger
} = require('../middleware/auth.middleware');

// Dynamic Pricing — logged in user
router.post('/dynamic-price', verifyToken, getDynamicPrice);

// Vehicle Recommendation — logged in user
router.post('/recommend', verifyToken, getVehicleRecommendation);

// Fraud Detection — passenger
router.get('/fraud-check', verifyPassenger, detectFraud);

// Demand Prediction — admin only
router.get('/demand', verifyAdmin, getDemandPrediction);

module.exports = router;