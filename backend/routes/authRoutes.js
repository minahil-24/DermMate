const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { syncCertificationFlags } = require('../utils/certHelpers');
const { notifyUser, notifyAllAdmins } = require('../utils/notify');
const { unlinkStoredFile } = require('../utils/uploadPaths');

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

// ----------------------
// GET ALL USERS (ADMIN) — MUST be registered before GET /users/:id or /users may not match
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
// ADMIN: dermatologists with certificates (verification queue)
// ----------------------
router.get('/admin/verification/doctors', auth(['admin']), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'dermatologist' })
      .select('-password')
      .sort({ name: 1 })
      .lean();
    const withCerts = doctors.filter((d) => (d.certifications || []).length > 0);
    res.json(withCerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const path = require('path');
const backendRoot = path.join(__dirname, '..');

function normalizeUploadRel(absPath) {
  let rel = path.relative(backendRoot, absPath).replace(/\\/g, '/');
  if (!rel || rel.startsWith('..')) {
    rel = absPath.replace(/\\/g, '/');
  }
  return rel;
}

// ----------------------
// UPDATE PROFILE TEXT (PATCH /profile) — JSON only, MongoDB fields; no multer
// ----------------------
router.patch('/profile', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allow = [
      'name', 'phoneNumber', 'location', 'gender', 'degree',
      'specialty', 'clinicName', 'city', 'bio', 'availability',
    ];

    allow.forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        user[key] = req.body[key];
      }
    });

    if (req.body.timeZone !== undefined) {
      user.timeZone = String(req.body.timeZone || '').trim().slice(0, 64);
    }

    if (req.body.onboardingCompleted !== undefined) {
      user.onboardingCompleted = Boolean(req.body.onboardingCompleted);
    }

    if (req.body.age !== undefined && req.body.age !== '') {
      user.age = parseInt(req.body.age, 10);
    }
    if (req.body.experience !== undefined && req.body.experience !== '') {
      user.experience = parseInt(req.body.experience, 10);
    }
    if (req.body.consultationFee !== undefined && req.body.consultationFee !== '') {
      user.consultationFee = parseFloat(req.body.consultationFee);
    }
    if (req.body.availabilitySlots !== undefined) {
      const slots = Array.isArray(req.body.availabilitySlots) ? req.body.availabilitySlots : []
      user.availabilitySlots = slots.map(String)
    }
    if (req.body.availabilityWeekdays !== undefined) {
      const raw = Array.isArray(req.body.availabilityWeekdays) ? req.body.availabilityWeekdays : []
      const set = new Set()
      for (const x of raw) {
        const n = Number(x)
        if (Number.isInteger(n) && n >= 0 && n <= 6) set.add(n)
      }
      user.availabilityWeekdays = [...set].sort((a, b) => a - b)
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: 'Profile updated', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// UPLOAD PROFILE FILES (POST /profile/files) — multer only; paths saved on User in MongoDB
// ----------------------
router.post('/profile/files', auth(), upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'certifications', maxCount: 10 },
]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!req.files || (!req.files.profilePhoto && !req.files.certifications)) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    if (req.files.profilePhoto) {
      user.profilePhoto = normalizeUploadRel(req.files.profilePhoto[0].path);
    }

    if (req.files.certifications) {
      const newItems = req.files.certifications.map((f) => ({
        filePath: normalizeUploadRel(f.path),
        status: 'pending',
        uploadedAt: new Date(),
      }));
      user.certifications = [...(user.certifications || []), ...newItems];
      syncCertificationFlags(user);
    }

    await user.save();

    if (req.files.certifications && user.role === 'dermatologist') {
      try {
        await notifyAllAdmins({
          title: 'New certificate uploaded',
          message: `${user.name} uploaded a new certificate for review.`,
          link: '/admin/verification',
          type: 'cert_upload',
        });
      } catch (e) {
        console.error('notifyAllAdmins:', e);
      }
    }

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: 'Files uploaded', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// DELETE CERTIFICATION (DELETE /certifications/:certId)
// ----------------------
router.delete('/certifications/:certId', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const certId = String(req.params.certId || '').trim();
    const idx = user.certifications.findIndex((c) => String(c._id) === certId);
    if (idx === -1) {
      return res.status(400).json({ message: 'Certification not found' });
    }

    const filePath = user.certifications[idx].filePath;

    user.certifications.splice(idx, 1);
    syncCertificationFlags(user);
    await user.save();

    unlinkStoredFile(filePath);

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: 'Certification removed', user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// ADMIN: SET CERTIFICATION STATUS (PATCH)
// ----------------------
router.patch(
  '/admin/doctors/:doctorId/certifications/:certId',
  auth(['admin']),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!['verified', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const doctor = await User.findOne({
        _id: req.params.doctorId,
        role: 'dermatologist',
      });
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

      const cert = doctor.certifications.find(
        (c) => c && c._id && String(c._id) === String(req.params.certId)
      );
      if (!cert) return res.status(404).json({ message: 'Certificate not found' });

      const prevStatus = cert.status;
      cert.status = status;
      syncCertificationFlags(doctor);
      await doctor.save();

      if (prevStatus !== status && (status === 'verified' || status === 'rejected')) {
        try {
          const label = status === 'verified' ? 'accepted' : 'declined';
          await notifyUser(doctor._id, {
            title: `Certificate ${label}`,
            message: `Your certificate "${path.basename(cert.filePath)}" was ${label} by an administrator.`,
            link: '/dermatologist/certification',
            type: 'cert_review',
          });
        } catch (e) {
          console.error('notifyUser doctor:', e);
        }
      }

      const doctorObj = doctor.toObject();
      delete doctorObj.password;
      res.json({ message: 'Certificate updated', doctor: doctorObj });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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
    const doctors = await User.find({ role: 'dermatologist' })
      .select('-password')
      .sort({ name: 1 })
      .lean();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------------------
// VERIFY DOCTOR (ADMIN ONLY)
// ----------------------
router.patch('/verify-doctor/:id', auth(['admin']), async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    (doctor.certifications || []).forEach((c) => {
      if (c.status === 'pending') c.status = 'verified';
    });
    syncCertificationFlags(doctor);
    await doctor.save();
    const doctorObj = doctor.toObject();
    delete doctorObj.password;
    res.json({ message: 'Doctor verified successfully', doctor: doctorObj });
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
