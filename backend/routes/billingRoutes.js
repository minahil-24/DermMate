const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getDermatologistBilling, 
  payDermatologistFees, 
  setDermatologistDeadline,
  getAllDermatologistBillingForAdmin,
  createPatientSession,
  createDermatologistSession,
  finalizePatientPayment
} = require('../controllers/BillingController');

router.get('/dermatologist', auth(['dermatologist']), getDermatologistBilling);
router.post('/pay', auth(['dermatologist']), payDermatologistFees);
router.post('/stripe/create-patient-session', auth(['patient']), createPatientSession);
router.post('/stripe/finalize-patient-payment', auth(['patient']), finalizePatientPayment);
router.post('/stripe/create-dermatologist-session', auth(['dermatologist']), createDermatologistSession);

// Admin Routes
router.post('/admin/set-deadline', auth(['admin']), setDermatologistDeadline);
router.get('/admin/all', auth(['admin']), getAllDermatologistBillingForAdmin);

module.exports = router;
