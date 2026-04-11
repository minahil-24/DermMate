const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

router.post('/query', auth(), async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userEmail = req.user.email; // From parsed JWT

    // Construct email options
    const emailOptions = {
      to: 'minahilsharif28@gmail.com', // Admin email
      subject: `Support Query: ${subject}`,
      html: `<p>You have received a new support query from <b>${req.user.name}</b> (${userEmail}):</p><br/><p>${message.replace(/\n/g, '<br/>')}</p>`,
      replyTo: userEmail
    };

    // Assuming sendEmail works and handles the SMTP side
    await sendEmail(emailOptions);

    res.status(200).json({ success: true, message: 'Support query sent successfully to Admin.' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send query. Try again later.' });
  }
});

module.exports = router;
