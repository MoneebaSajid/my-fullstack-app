const express = require('express');
const router = express.Router();

const {
  submitFeedback,
  getMyFeedback,
  getAllFeedback
} = require('../controllers/feedback.controller');

const {
  verifyPassenger,
  verifyAdmin
} = require('../middleware/auth.middleware');

router.post('/submit', verifyPassenger, submitFeedback);
router.get('/my-feedback', verifyPassenger, getMyFeedback);
router.get('/all', verifyAdmin, getAllFeedback);

module.exports = router;