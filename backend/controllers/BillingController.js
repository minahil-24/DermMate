const User = require('../models/User');
const Case = require('../models/Case');

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

    const systemFeePending = totalCharges * 0.05;
    
    // Check if blocked based on deadline
    const user = await User.findById(dermatologistId);

    res.status(200).json({
      success: true,
      data: {
        totalCharges,
        systemFeePending,
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
    
    // Mock payment success - resets deadline and unblocks
    const user = await User.findByIdAndUpdate(
      dermatologistId,
      { feePaymentDeadline: null, blockedDueToUnpaidFee: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment mock successful. Activities unblocked.',
      user
    });
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

    const dermatologists = await User.find({ role: 'dermatologist' }).select('name email consultationFee feePaymentDeadline blockedDueToUnpaidFee');
    const cases = await Case.find({ caseStatus: { $nin: ['cancelled', 'rejected'] } }).populate('doctor', 'name');

    const result = dermatologists.map(doc => {
      const docCases = cases.filter(c => c.doctor && c.doctor._id.toString() === doc._id.toString());
      const totalCharges = docCases.reduce((sum, c) => sum + (c.consultationFee || 0), 0);
      const systemCut = totalCharges * 0.05;
      
      return {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        totalCases: docCases.length,
        totalCharges,
        systemCut,
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
