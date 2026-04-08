const mongoose = require('mongoose')

/**
 * All profile fields (name, location, specialty, etc.) are stored in MongoDB
 * via the User collection. Multer is only used in routes that upload files
 * (profile photo, certificates, case files); those store file paths in this document.
 */

const certificationSchema = new mongoose.Schema(
  {
    filePath: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

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
  certifications: { type: [certificationSchema], default: [] },
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
