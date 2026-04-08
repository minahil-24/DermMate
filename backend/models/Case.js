const mongoose = require('mongoose')

const fileEntry = {
  filePath: { type: String, required: true },
  originalName: { type: String, default: '' },
}

const affectedEntry = {
  filePath: { type: String, required: true },
  originalName: { type: String, default: '' },
  complaintType: { type: String, enum: ['skin', 'hair', 'nails'], required: true },
}

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
  },
  { timestamps: true }
)

module.exports = mongoose.model('MedicalCase', caseSchema)
