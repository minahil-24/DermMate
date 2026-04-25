const User = require('../models/User');

const checkBlock = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'dermatologist') {
      const user = await User.findById(req.user.id);
      if (user) {
        // Enforce dynamic deadline check if not yet blocked but past due
        let isBlocked = user.blockedDueToUnpaidFee;
        
        if (user.feePaymentDeadline && new Date() > user.feePaymentDeadline && !isBlocked) {
            user.blockedDueToUnpaidFee = true;
            await user.save();
            isBlocked = true;
        }

        if (isBlocked) {
          // Allow billing requests to pass through so they can unblock
          if (req.originalUrl.includes('/api/billing')) {
              return next();
          }
          return res.status(403).json({ message: "Blocked due to unpaid fees. Please pay your pending charges to continue." });
        }
      }
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error checking block status" });
  }
};

module.exports = checkBlock;
