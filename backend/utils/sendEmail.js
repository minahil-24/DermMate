const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, replyTo }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"DermMate" <${process.env.EMAIL_USER}>`,
    to,
    replyTo: replyTo || process.env.EMAIL_USER,
    subject,
    html,
  });
};

module.exports = sendEmail;
