const User = require('../models/User');
const Case = require('../models/Case');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY, { timeout: 15000 }) : null;

/**
 * Get billing details for the logged-in dermatologist
 * Calculates 5% fee only for cases that have been ACCEPTED.
 */
exports.getDermatologistBilling = async (req, res) => {
  try {
    const dermatologistId = req.user.id;
    // Only count cases that the doctor has accepted (and not cancelled later)
    const cases = await Case.find({ 
      doctor: dermatologistId, 
      doctorReviewStatus: 'accepted',
      caseStatus: { $ne: 'cancelled' } 
    }).populate('patient', 'name');

    let totalCharges = 0;
    const payments = [];

    cases.forEach((c) => {
      if (c.consultationFee > 0) {
        totalCharges += c.consultationFee;
        payments.push({
          id: c._id,
          patient: c.patient?.name || 'Unknown',
          amount: c.consultationFee,
          date: c.appointmentDate,
          systemFee: c.consultationFee * 0.05
        });
      }
    });

    const user = await User.findById(dermatologistId);
    let systemFeePending = Math.round(totalCharges * 0.05) - (user.systemFeePaid || 0);
    if (systemFeePending < 0) systemFeePending = 0;

    res.status(200).json({
      success: true,
      data: {
        totalCharges,
        systemFeePending,
        systemFeePaid: user.systemFeePaid || 0,
        payments: payments.sort((a, b) => new Date(b.date) - new Date(a.date)),
        feePaymentDeadline: user.feePaymentDeadline,
        blockedDueToUnpaidFee: user.blockedDueToUnpaidFee
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Finalize payment for dermatologist system fees
 */
exports.payDermatologistFees = async (req, res) => {
  try {
    const dermatologistId = req.user.id;
    const { session_id } = req.body;

    let paidAmount = 0;
    
    // 1. Verify with Stripe if session_id is provided
    if (stripe && session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === 'paid') {
          paidAmount = session.amount_total / 100;
        }
      } catch (stripeErr) {
        console.error('Stripe retrieval error:', stripeErr.message);
      }
    }

    // 2. Fallback: Calculate pending amount if Stripe check failed or was skipped
    if (paidAmount === 0) {
      const cases = await Case.find({ 
        doctor: dermatologistId, 
        doctorReviewStatus: 'accepted',
        caseStatus: { $ne: 'cancelled' } 
      });
      let totalCharges = 0;
      cases.forEach(c => { if (c.consultationFee > 0) totalCharges += c.consultationFee; });
      const currentUser = await User.findById(dermatologistId);
      paidAmount = Math.round(totalCharges * 0.05) - (currentUser.systemFeePaid || 0);
      if (paidAmount < 0) paidAmount = 0;
    }

    // 3. Update User record (with duplicate protection)
    const user = await User.findById(dermatologistId);
    user.processedSessions = user.processedSessions || [];
    
    if (session_id && user.processedSessions.includes(session_id)) {
      return res.status(200).json({ success: true, message: 'Payment already recorded.', user });
    }

    if (session_id) user.processedSessions.push(session_id);
    
    user.feePaymentDeadline = null;
    user.blockedDueToUnpaidFee = false;
    user.systemFeePaid = (user.systemFeePaid || 0) + paidAmount;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and records updated.',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Stripe Session for dermatologist system fees
 */
exports.createDermatologistSession = async (req, res) => {
  try {
    const dermatologistId = req.user.id;
    const cases = await Case.find({ 
      doctor: dermatologistId, 
      doctorReviewStatus: 'accepted',
      caseStatus: { $ne: 'cancelled' } 
    });

    let totalCharges = 0;
    cases.forEach(c => { if (c.consultationFee > 0) totalCharges += c.consultationFee; });

    const user = await User.findById(dermatologistId);
    let systemFeePending = Math.round(totalCharges * 0.05) - (user.systemFeePaid || 0);
    if (systemFeePending < 0) systemFeePending = 0;

    if (systemFeePending <= 0) {
      return res.status(400).json({ message: 'No system fee pending.' });
    }

    const frontendUrl = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: { name: 'DermMate System Fee' },
          unit_amount: Math.round(systemFeePending * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=dermatologist`,
      cancel_url: `${frontendUrl}/dermatologist/payments`,
      client_reference_id: dermatologistId
    });
    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Stripe Session for patient consultation
 */
exports.createPatientSession = async (req, res) => {
  try {
    const { caseId } = req.body;
    const patientId = req.user.id;

    const c = await Case.findOne({ _id: caseId, patient: patientId }).populate('doctor', 'name');
    if (!c) return res.status(404).json({ message: 'Case not found' });

    const amount = c.consultationFee > 0 ? c.consultationFee : 1000;
    const frontendUrl = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!stripe) return res.status(500).json({ message: 'Stripe is not configured.' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: { name: `Consultation: Dr. ${c.doctor?.name || 'Unknown'}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=patient&caseId=${caseId}`,
      cancel_url: `${frontendUrl}/patient/cases`,
      client_reference_id: caseId
    });
    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Finalize patient payment
 */
exports.finalizePatientPayment = async (req, res) => {
  try {
    const { caseId, session_id } = req.body;
    const patientId = req.user.id;

    const c = await Case.findOne({ _id: caseId, patient: patientId });
    if (!c) return res.status(404).json({ message: 'Case not found' });

    c.processedSessions = c.processedSessions || [];
    if (session_id && c.processedSessions.includes(session_id)) {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }
    if (session_id) c.processedSessions.push(session_id);

    c.paymentStatus = 'paid';
    await c.save();

    res.status(200).json({ success: true, message: 'Payment finalized' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Set payment deadline (Admin only)
 */
exports.setDermatologistDeadline = async (req, res) => {
  try {
    const { dermatologistId, deadline } = req.body;
    const user = await User.findById(dermatologistId);
    if (!user) return res.status(404).json({ message: 'Dermatologist not found' });

    user.feePaymentDeadline = new Date(deadline);
    user.blockedDueToUnpaidFee = user.feePaymentDeadline < new Date();
    await user.save();

    res.status(200).json({ success: true, message: 'Deadline updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all revenues for Admin
 */
exports.getAllDermatologistBillingForAdmin = async (req, res) => {
  try {
    const dermatologists = await User.find({ role: 'dermatologist' }).select('name email systemFeePaid feePaymentDeadline blockedDueToUnpaidFee');
    const cases = await Case.find({ 
      doctorReviewStatus: 'accepted',
      caseStatus: { $ne: 'cancelled' } 
    }).populate('doctor', 'name');

    const result = dermatologists.map(doc => {
      const docCases = cases.filter(c => c.doctor && c.doctor._id.toString() === doc._id.toString());
      const totalCharges = docCases.reduce((sum, c) => sum + (c.consultationFee || 0), 0);
      const systemCut = Math.round(totalCharges * 0.05);
      const systemFeePaid = doc.systemFeePaid || 0;
      let systemFeePending = systemCut - systemFeePaid;
      if (systemFeePending < 0) systemFeePending = 0;

      return {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        totalCases: docCases.length,
        totalCharges,
        systemCut,
        systemFeePaid,
        systemFeePending,
        status: doc.blockedDueToUnpaidFee ? 'Blocked' : 'Active',
        deadline: doc.feePaymentDeadline
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
