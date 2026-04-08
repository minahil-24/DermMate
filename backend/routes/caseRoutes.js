const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const MedicalCase = require('../models/Case')
const User = require('../models/User')
const auth = require('../middleware/auth')
const upload = require('../middleware/caseUpload')
const { notifyUser } = require('../utils/notify')

const router = express.Router()
const backendRoot = path.join(__dirname, '..')

/** JWT may expose id as string; normalize for DB comparison */
function authUserId(req) {
  const u = req.user
  if (!u) return null
  const raw = u.id != null ? u.id : u._id
  return raw != null ? String(raw) : null
}

function relPath(absPath) {
  return path.relative(backendRoot, absPath).replace(/\\/g, '/')
}

router.post('/upload', auth(['patient']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const filePath = relPath(req.file.path)
    res.json({
      filePath,
      originalName: req.file.originalname || '',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/', auth(['patient']), async (req, res) => {
  try {
    const {
      doctorId,
      complaintType,
      questionnaire,
      medicalHistoryFiles,
      affectedImages,
      appointmentDate,
      appointmentTimeSlot,
      consultationFee,
      paymentMethod,
    } = req.body

    if (!['skin', 'hair', 'nails'].includes(complaintType)) {
      return res.status(400).json({ message: 'Invalid complaint type' })
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'dermatologist' })
    if (!doctor) {
      return res.status(404).json({ message: 'Dermatologist not found' })
    }

    const med = Array.isArray(medicalHistoryFiles) ? medicalHistoryFiles : []
    const aff = Array.isArray(affectedImages) ? affectedImages : []
    if (aff.length < 1 || aff.length > 3) {
      return res.status(400).json({ message: 'Please upload 1–3 affected area images' })
    }
    for (const img of aff) {
      if (img.complaintType && img.complaintType !== complaintType) {
        return res.status(400).json({ message: 'Image tags must match selected complaint type' })
      }
    }

    let paymentStatus = 'pending'
    if (paymentMethod === 'online') {
      paymentStatus = 'paid'
    } else if (paymentMethod === 'cod' || paymentMethod === 'cash') {
      paymentStatus = 'pending_cod'
    }

    const doc = new MedicalCase({
      patient: req.user.id,
      doctor: doctorId,
      complaintType,
      questionnaire: questionnaire || {},
      medicalHistoryFiles: med.map((f) => ({
        filePath: f.filePath,
        originalName: f.originalName || '',
      })),
      affectedImages: aff.map((f) => ({
        filePath: f.filePath,
        originalName: f.originalName || '',
        complaintType: f.complaintType || complaintType,
      })),
      appointmentDate: new Date(appointmentDate),
      appointmentTimeSlot,
      consultationFee: Number(consultationFee) || doctor.consultationFee || 0,
      paymentMethod,
      paymentStatus,
      caseStatus: 'submitted',
      doctorReviewStatus: 'pending',
      isCancelledByPatient: false,
    })

    await doc.save()
    const populated = await MedicalCase.findById(doc._id)
      .populate('doctor', 'name email specialty')
      .populate('patient', 'name email')
      .lean()

    try {
      await notifyUser(doctor._id, {
        title: 'New pre-appointment case',
        message: `${populated.patient?.name || 'A patient'} submitted a case for review before an appointment.`,
        link: '/dermatologist/appointments',
        type: 'case_submitted',
      })
    } catch (e) {
      console.error('notifyUser doctor case:', e)
    }

    res.status(201).json({ message: 'Case submitted', case: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/my', auth(['patient']), async (req, res) => {
  try {
    const list = await MedicalCase.find({ patient: req.user.id })
      .populate('doctor', 'name specialty email profilePhoto')
      .sort({ createdAt: -1 })
      .lean()
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/doctor/incoming', auth(['dermatologist']), async (req, res) => {
  try {
    const list = await MedicalCase.find({ doctor: req.user.id })
      .populate('patient', 'name email profilePhoto phoneNumber location age gender')
      .sort({ createdAt: -1 })
      .lean()
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

async function patchDoctorReview(req, res) {
  try {
    const { decision } = req.body
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be accepted or rejected' })
    }

    const caseId = String(req.params.caseId || '').trim()
    const doctorId = authUserId(req)
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid session' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== doctorId) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }
    if (c.isCancelledByPatient) {
      return res.status(400).json({ message: 'Case was cancelled by the patient' })
    }
    if (c.doctorReviewStatus !== 'pending') {
      return res.status(400).json({ message: 'Case already reviewed' })
    }

    c.doctorReviewStatus = decision
    await c.save()

    const doctor = await User.findById(doctorId).select('name')
    const title = decision === 'accepted' ? 'Case accepted' : 'Case update'
    const msg =
      decision === 'accepted'
        ? `Dr. ${doctor?.name || 'Your dermatologist'} accepted your pre-appointment case.`
        : `Dr. ${doctor?.name || 'Your dermatologist'} could not proceed with your case request.`

    try {
      await notifyUser(c.patient, {
        title,
        message: msg,
        link: '/patient/appointments',
        type: 'case_review',
      })
    } catch (e) {
      console.error('notify patient review:', e)
    }

    const populated = await MedicalCase.findById(c._id)
      .populate('patient', 'name email profilePhoto')
      .populate('doctor', 'name specialty')
      .lean()

    res.json({ message: 'Updated', case: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Prefer /review/:caseId (clearer; avoids param ordering issues). Legacy: /:caseId/review
router.patch('/review/:caseId', auth(['dermatologist']), patchDoctorReview)
router.patch('/:caseId/review', auth(['dermatologist']), patchDoctorReview)

router.patch('/:caseId/cancel', auth(['patient']), async (req, res) => {
  try {
    const c = await MedicalCase.findOne({
      _id: req.params.caseId,
      patient: req.user.id,
    })
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (c.isCancelledByPatient) {
      return res.status(400).json({ message: 'Already cancelled' })
    }
    if (c.doctorReviewStatus !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel after doctor has responded' })
    }

    c.isCancelledByPatient = true
    await c.save()

    try {
      await notifyUser(c.doctor, {
        title: 'Case cancelled',
        message: 'A patient cancelled their pre-appointment case request.',
        link: '/dermatologist/appointments',
        type: 'case_cancelled',
      })
    } catch (e) {
      console.error('notify doctor cancel:', e)
    }

    const populated = await MedicalCase.findById(c._id)
      .populate('doctor', 'name')
      .lean()
    res.json({ message: 'Cancelled', case: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/:caseId/mark-paid', auth(['patient']), async (req, res) => {
  try {
    const c = await MedicalCase.findOne({
      _id: req.params.caseId,
      patient: req.user.id,
    })
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (c.isCancelledByPatient) {
      return res.status(400).json({ message: 'Case is cancelled' })
    }

    c.paymentStatus = 'paid'
    await c.save()

    const populated = await MedicalCase.findById(c._id)
      .populate('doctor', 'name')
      .lean()

    res.json({ message: 'Payment recorded', case: populated })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
