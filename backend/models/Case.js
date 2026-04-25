const mongoose = require('mongoose')

const fileEntry = {
  filePath: { type: String, required: true },
  originalName: { type: String, default: '' },
}

const affectedEntry = {
  filePath: { type: String, required: true },
  originalName: { type: String, default: '' },
  complaintType: { type: String, enum: ['skin', 'hair', 'nails'], required: true },
  uploadedAt: { type: Date, default: Date.now },
  /** Doctor-only: alopecia YOLO output; stripped for patient API responses */
  aiAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
}

const noteEntry = new mongoose.Schema(
  {
    text: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const reportEntry = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    filePath: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const comparisonEntry = new mongoose.Schema(
  {
    beforePath: { type: String, required: true },
    afterPath: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const followUpEntry = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    reason: { type: String, default: 'Follow-up' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const treatmentMedication = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  { _id: false }
)

const caseSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    complaintType: { type: String, enum: ['skin', 'hair', 'nails'], required: true },
    questionnaire: { type: mongoose.Schema.Types.Mixed, default: {} },
    medicalHistoryFiles: { type: [fileEntry], default: [] },
    affectedImages: { type: [affectedEntry], default: [] },
    appointmentDate: { type: Date, required: true },
    appointmentTimeSlot: { type: String, required: true },
    consultationFee: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'pending' },
    caseStatus: { type: String, default: 'submitted' },
    /** Doctor accept/reject on pre-appointment case */
    doctorReviewStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    isCancelledByPatient: { type: Boolean, default: false },

    /** Optional note from dermatologist when declining (patient sees in notification + My cases) */
    doctorRejectionComment: { type: String, default: '' },
    /** Calendar day (YYYY-MM-DD in resolved TZ) we already sent "appointment tomorrow" for; cleared when appointment/resubmit changes */
    doctorTomorrowReminderAptYmd: { type: String, default: '' },

    /** Dermatologist workspace */
    clinicalNotes: { type: [noteEntry], default: [] },
    reports: { type: [reportEntry], default: [] },
    comparisons: { type: [comparisonEntry], default: [] },
    followUps: { type: [followUpEntry], default: [] },

    treatmentPlan: {
      medications: { type: [treatmentMedication], default: [] },
      lifestyle: { type: [String], default: [] },
      notes: { type: String, default: '' },
      updatedAt: { type: Date, default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },

    /** Treatment progress percentage (0-100) */
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('MedicalCase', caseSchema)
