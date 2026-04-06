const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// ----------------------
// REGISTER
// ----------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, degree, specialty, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'patient',
      degree,
      specialty,
      location,
      verificationToken,
      verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000,
      isVerified: false
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        to: email,
        subject: 'DermMate - Verify your email',
        html: `<h1>Email Verification</h1><p>Please verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`
      });
    } catch (err) {
      console.error("Email error:", err);
    }

    res.status(201).json({ message: 'User registered. Please verify your email.' });
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

    // Hardcoded Admin
    if (email === 'minahil@gmail.com' && password === '11111111') {
      let admin = await User.findOne({ email });
      if (!admin) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin = new User({ 
          name: 'Admin Minahil', 
          email, 
          password: hashedPassword, 
          role: 'admin', 
          isVerified: true 
        });
        await admin.save();
      }
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified) return res.status(401).json({ message: 'Please verify email first.' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      token,
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// GET CURRENT USER (/me)
// ----------------------
router.get('/me', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const fs = require('fs');
const path = require('path');

// ----------------------
// UPDATE PROFILE (PUT /profile)
// ----------------------
router.put('/profile', auth(), upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'certifications', maxCount: 10 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updateData = { ...req.body };

    // Handle File Uploads
    if (req.files) {
      if (req.files.profilePhoto) {
        updateData.profilePhoto = req.files.profilePhoto[0].path;
      }
      if (req.files.certifications) {
        // Push new certifications to the existing array
        const newCerts = req.files.certifications.map(f => f.path);
        user.certifications = [...(user.certifications || []), ...newCerts];
        user.isPendingVerification = true; // Mark as pending review
      }
    }

    // Role-specific field mapping
    if (updateData.age) updateData.age = parseInt(updateData.age);
    if (updateData.experience) updateData.experience = parseInt(updateData.experience);
    if (updateData.consultationFee) updateData.consultationFee = parseFloat(updateData.consultationFee);

    // Update other fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'certifications') {
        user[key] = updateData[key];
      }
    });

    await user.save();
    
    // Return full updated user (minus password)
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Profile updated', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// DELETE CERTIFICATION (DELETE /certifications/:index)
// ----------------------
router.delete('/certifications/:index', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = parseInt(req.params.index);
    if (index < 0 || index >= user.certifications.length) {
      return res.status(400).json({ message: 'Invalid certification index' });
    }

    const filePath = user.certifications[index];
    
    // 1. Remove from Array
    user.certifications.splice(index, 1);
    await user.save();

    // 2. Physical File Deletion from Disk
    try {
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error("File deletion error:", err);
      // We don't fail the request if file deletion fails, as DB is already updated
    }

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: 'Certification removed', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// GET SINGLE USER (PUBLIC/PROTECTED)
// ----------------------
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// GET SYSTEM STATS (ADMIN ONLY)
// ----------------------
router.get('/stats', auth(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'dermatologist' });
    const verifiedDoctors = await User.countDocuments({ role: 'dermatologist', isDoctorVerified: true });

    res.json({
      totalUsers,
      totalPatients,
      totalDoctors,
      verifiedDoctors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// GET ALL DOCTORS (PUBLIC)
// ----------------------
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'dermatologist' }).select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// GET ALL USERS (ADMIN ONLY)
// ----------------------
router.get('/users', auth(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// VERIFY DOCTOR (ADMIN ONLY)
// ----------------------
router.patch('/verify-doctor/:id', auth(['admin']), async (req, res) => {
  try {
    const doctor = await User.findByIdAndUpdate(req.params.id, { 
      isDoctorVerified: true,
      isPendingVerification: false 
    }, { new: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor verified successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Existing routes (Verify Email, Forgot Password, Reset Password)
// ----------------------
// VERIFY EMAIL
// ----------------------
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... omitting forgot-password and reset-password for brevity unless needed

// ----------------------
// DELETE USER (ADMIN ONLY)
// ----------------------
router.delete('/users/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
