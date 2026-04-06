const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['patient', 'dermatologist', 'admin'],
    default: 'patient'
  },

  // Common Profile Fields
  phoneNumber: String,
  location: String,
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  age: Number,
  profilePhoto: String, // URL/Path to uploaded photo

  // Dermatologist Specific Fields
  degree: String,
  specialty: String,
  experience: Number,
  clinicName: String,
  city: String,
  bio: String,
  consultationFee: Number,
  availability: String,
  certifications: { type: [String], default: [] }, // Array of Paths to uploaded certificates
  isDoctorVerified: {
    type: Boolean,
    default: false
  },
  isPendingVerification: {
    type: Boolean,
    default: false
  },

  // Verification & Status
  isVerified: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  // Auth Tokens
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
