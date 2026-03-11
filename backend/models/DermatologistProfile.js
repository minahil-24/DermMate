const mongoose = require('mongoose');

const dermatologistProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  specialty: {
    type: String,
  },
  yearsOfExperience: {
    type: Number,
  },
  qualifications: {
    type: String,
  },
  clinicName: {
    type: String,
  },
  clinicAddress: {
    type: String,
  },
  city: {
    type: String,
  },
  phone: {
    type: String,
  },
  bio: {
    type: String,
  },
  consultationFee: {
    type: Number,
  },
  availability: {
    type: String, // e.g., "Mon-Fri, 9AM-5PM"
  },
  profilePhoto: {
    type: String, // File path
  },
  certifications: [{
    type: String // Array of file paths
  }],
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DermatologistProfile', dermatologistProfileSchema);
