const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['patient', 'dermatologist', 'admin'],
    default: 'patient'
  },

  // Dermatologist extra fields
  degree: String,
  specialty: String,
  experience: Number,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  // Onboarding & Profile Info
  age: Number,
  phoneNumber: String,
  clinicName: String,
  location: String,
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },

  certificate: String,
  // Email Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpire: Date,

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
})

module.exports = mongoose.model('User', userSchema)
