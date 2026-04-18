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
  /** Precise clinic address from map / Nominatim (separate from general location text). */
  clinicAddress: { type: String, default: '' },
  clinicLatitude: { type: Number, default: null },
  clinicLongitude: { type: Number, default: null },
  /** GeoJSON Point for MongoDB geospatial queries [lng, lat] */
  clinicLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: { type: [Number], default: undefined },
  },
  city: String,
  bio: String,
  consultationFee: Number,
  availability: String,
  availabilitySlots: { type: [String], default: [] },
  /** Days of week the doctor sees patients (0=Sun … 6=Sat, matches Date.getDay()). Empty = all days. */
  availabilityWeekdays: { type: [Number], default: [] },
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

  /** IANA timezone for appointment reminders (e.g. Asia/Karachi); optional, falls back to env/UTC */
  timeZone: { type: String, default: '' },

  // Billing and Fees
  feePaymentDeadline: { type: Date, default: null },
  blockedDueToUnpaidFee: { type: Boolean, default: false },

  // Auth Tokens
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true })

userSchema.index({ clinicLocation: '2dsphere' }, { sparse: true })

userSchema.pre('save', function syncClinicGeo() {
  if (this.role !== 'dermatologist') {
    return
  }
  const lat = this.clinicLatitude
  const lng = this.clinicLongitude
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    this.clinicLocation = { type: 'Point', coordinates: [lng, lat] }
  } else {
    this.clinicLocation = undefined
  }
})

module.exports = mongoose.model('User', userSchema)
