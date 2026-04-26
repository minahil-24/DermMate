const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkBlock = require('../middleware/checkBlock');
const BillingController = require('../controllers/BillingController');

// Destructure controllers for cleaner route definitions
const { 
  getDermatologistBilling, 
  payDermatologistFees, 
  setDermatologistDeadline,
  getAllDermatologistBillingForAdmin,
  createPatientSession,
  createDermatologistSession,
  finalizePatientPayment
} = BillingController;

// Dermatologist Routes
router.get('/dermatologist', auth(['dermatologist']), checkBlock, getDermatologistBilling);
router.post('/pay', auth(['dermatologist']), payDermatologistFees);

// Patient Routes
router.post('/stripe/create-patient-session', auth(['patient']), createPatientSession);
router.post('/stripe/finalize-patient-payment', auth(['patient']), finalizePatientPayment);

// Stripe Session Creation
router.post('/stripe/create-dermatologist-session', auth(['dermatologist']), createDermatologistSession);

// Admin Routes
router.post('/admin/set-deadline', auth(['admin']), setDermatologistDeadline);
router.get('/admin/all', auth(['admin']), getAllDermatologistBillingForAdmin);

module.exports = router;
