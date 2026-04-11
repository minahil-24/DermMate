const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getDermatologistBilling, 
  payDermatologistFees, 
  setDermatologistDeadline,
  getAllDermatologistBillingForAdmin
} = require('../controllers/BillingController');

router.get('/dermatologist', auth(['dermatologist']), getDermatologistBilling);
router.post('/pay', auth(['dermatologist']), payDermatologistFees);

// Admin Routes
router.post('/admin/set-deadline', auth(['admin']), setDermatologistDeadline);
router.get('/admin/all', auth(['admin']), getAllDermatologistBillingForAdmin);

module.exports = router;
