const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// ----------------------
// REGISTER
// ----------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, degree, specialty, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      degree,
      specialty,
      location,
      verificationToken,
      verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      isVerified: false
    });

    await user.save();
    console.log(`User created in DB: ${user.email} (ID: ${user._id})`);

    // Send Verification Email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: email,
        subject: 'DermMate - Verify your email',
        html: `
          <h1>Email Verification</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
        `
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // We don't want to fail registration if email fails, but we should let them know or handle it.
      // For now, logging it.
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// LOGIN
// ----------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin hardcoded login specifically if needed by backend, 
    // but usually frontend handles the hardcoded check for 'minahil@gmail.com'.
    // If we want to support it here:
    if (email === 'minahil@gmail.com' && password === '11111111') {
      // Ideally this should be in the DB, but reproducing frontend logic if needed or just letting it fail here 
      // if the user doesn't exist in DB. 
      // The frontend currently short-circuits this, so we don't strictly need it here.
      // However, if the frontend calls this API, we should probably return 404/401 unless we create this user.
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// VERIFY EMAIL
// ----------------------
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    console.log("Verifying Email Token:", token);

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log("Verification Failed: Invalid or Expired Token");
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// FORGOT PASSWORD
// ----------------------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token (optional, but good practice) - simplfying to just store token for now or use crypto hash
    // Using unhashed token for simplicity in URL, store raw or hashed. 
    // Let's store raw for this implementation as per typical simple tutorials, 
    // or better: hash it before saving, send raw.
    // For simplicity and speed correctly: Save raw token.

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log("Reset Link Sent:", resetUrl); // Debug log

    const message = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Please click the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
        `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'DermMate - Password Reset',
        html: message
      });
      res.json({ message: 'Email sent' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// RESET PASSWORD
// ----------------------
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = req.params.token;

    console.log("Reset Request for Token:", resetPasswordToken);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log("Invalid or Expired Token");
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password Reset Successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// UPDATE PROFILE (ONBOARDING)
// ----------------------
const auth = require('../middleware/auth');

router.put('/profile', auth(), async (req, res) => {
  try {
    const { age, phoneNumber, location, clinicName, specialty, experience, gender } = req.body;
    const userId = req.user.id;
    console.log(`Updating profile for user: ${userId}`, req.body);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (age) user.age = age;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (location) user.location = location;
    if (clinicName) user.clinicName = clinicName;
    if (specialty) user.specialty = specialty;
    if (experience) user.experience = experience;
    if (gender) user.gender = gender;

    user.onboardingCompleted = true;
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        age: user.age,
        phoneNumber: user.phoneNumber,
        location: user.location,
        clinicName: user.clinicName,
        specialty: user.specialty,
        experience: user.experience,
        gender: user.gender
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
