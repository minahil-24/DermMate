const User = require('../models/User');
const Case = require('../models/Case');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY, { timeout: 15000 }) : null;

exports.getDermatologistBilling = async (req, res) => {
  try {
    const dermatologistId = req.user.id;
    // Get all completed/accepted cases for this dermatologist
    const cases = await Case.find({ doctor: dermatologistId, caseStatus: { $nin: ['cancelled', 'rejected'] } })
      .populate('patient', 'name');

    let totalCharges = 0;
    const payments = [];

    cases.forEach((c) => {
      // Assuming consultationFee holds the case charge
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

    // Check if blocked based on deadline
    const user = await User.findById(dermatologistId);
    let systemFeePending = Math.round(totalCharges * 0.05) - (user.systemFeePaid || 0);
    if (systemFeePending < 0) systemFeePending = 0;

    res.status(200).json({
      success: true,
      data: {
        totalCharges,
        systemFeePending,
        systemFeePaid: user.systemFeePaid || 0,
        payments: payments.sort((a,b) => new Date(b.date) - new Date(a.date)),
        feePaymentDeadline: user.feePaymentDeadline,
        blockedDueToUnpaidFee: user.blockedDueToUnpaidFee
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.payDermatologistFees = async (req, res) => {
  try {
    const dermatologistId = req.user.id;
    // In a real app we'd verify the stripe session ID here
    const { session_id } = req.body; 
    
    let paidAmount = 0;
    if (stripe && session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === 'paid') {
          paidAmount = session.amount_total / 100;
        }
      } catch (stripeErr) {
        console.error('Stripe retrieval error:', stripeErr);
      }
    }
    
    // Fallback if no stripe, no session_id, or if stripe retrieval failed
    if (paidAmount === 0) {
      const cases = await Case.find({ doctor: dermatologistId, caseStatus: { $nin: ['cancelled', 'rejected'] } });
      let totalCharges = 0;
      cases.forEach(c => { if (c.consultationFee > 0) totalCharges += c.consultationFee; });
      const currentUser = await User.findById(dermatologistId);
      paidAmount = Math.round(totalCharges * 0.05) - (currentUser.systemFeePaid || 0);
      if (paidAmount < 0) paidAmount = 0;
    }

    // Payment success - resets deadline, unblocks, and updates paid fee
    const user = await User.findById(dermatologistId);
    user.feePaymentDeadline = null;
    user.blockedDueToUnpaidFee = false;
    user.systemFeePaid = (user.systemFeePaid || 0) + paidAmount;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Payment mock/verification successful. Activities unblocked.',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDermatologistSession = async (req, res) => {
  try {
    const dermatologistId = req.user.id;
    const cases = await Case.find({ doctor: dermatologistId, caseStatus: { $nin: ['cancelled', 'rejected'] } });
    
    let totalCharges = 0;
    cases.forEach(c => {
      if (c.consultationFee > 0) totalCharges += c.consultationFee;
    });
    
    const user = await User.findById(dermatologistId);
    let systemFeePending = Math.round(totalCharges * 0.05) - (user.systemFeePaid || 0);
    if (systemFeePending < 0) systemFeePending = 0;
    
    if (systemFeePending <= 0) {
      return res.status(400).json({ message: 'No system fee pending.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured. Please contact administration.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: {
            name: 'DermMate System Fee',
          },
          unit_amount: systemFeePending * 100, // in cents/paisa
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
    console.error('\n===== STRIPE ERROR (Dermatologist Session) =====');
    console.error('Error Type:', error.type || 'Unknown');
    console.error('Error Code:', error.code || 'N/A');
    console.error('Error Message:', error.message);
    console.error('Status Code:', error.statusCode || 'N/A');
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('>>> Network issue: Cannot reach api.stripe.com. Check firewall/ISP/VPN.');
    }
    console.error('================================================\n');
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPatientSession = async (req, res) => {
  try {
    const { caseId } = req.body;
    const patientId = req.user.id;

    const c = await Case.findOne({ _id: caseId, patient: patientId }).populate('doctor', 'name');
    if (!c) return res.status(404).json({ message: 'Case not found' });

    const amount = c.consultationFee > 0 ? c.consultationFee : 1000; // defaults if 0
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured. Please contact administration.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: {
            name: `Consultation: Dr. ${c.doctor?.name || 'Unknown'}`,
          },
          unit_amount: amount * 100, // in cents/paisa
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
    console.error('\n===== STRIPE ERROR (Patient Session) =====');
    console.error('Error Type:', error.type || 'Unknown');
    console.error('Error Code:', error.code || 'N/A');
    console.error('Error Message:', error.message);
    console.error('Status Code:', error.statusCode || 'N/A');
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('>>> Network issue: Cannot reach api.stripe.com. Check firewall/ISP/VPN.');
    }
    console.error('==========================================\n');
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.finalizePatientPayment = async (req, res) => {
  try {
    const { caseId, session_id } = req.body;
    const patientId = req.user.id;

    const c = await Case.findOne({ _id: caseId, patient: patientId });
    if (!c) return res.status(404).json({ message: 'Case not found' });
    
    // In a real app we'd verify the stripe session ID status here via stripe API
    c.paymentStatus = 'paid';
    await c.save();

    res.status(200).json({ success: true, message: 'Payment finalized', caseId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setDermatologistDeadline = async (req, res) => {
  try {
    const { dermatologistId, deadline } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can set deadlines' });
    }

    const user = await User.findById(dermatologistId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Dermatologist not found' });
    }

    user.feePaymentDeadline = new Date(deadline);
    // Re-evaluate block status
    if (user.feePaymentDeadline < new Date()) {
      user.blockedDueToUnpaidFee = true;
    } else {
      user.blockedDueToUnpaidFee = false;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Deadline updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllDermatologistBillingForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can view all revenues' });
    }

    const dermatologists = await User.find({ role: 'dermatologist' }).select('name email consultationFee feePaymentDeadline blockedDueToUnpaidFee systemFeePaid');
    const cases = await Case.find({ caseStatus: { $nin: ['cancelled', 'rejected'] } }).populate('doctor', 'name');

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

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
