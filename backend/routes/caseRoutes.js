const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const MedicalCase = require('../models/Case')
const User = require('../models/User')
const auth = require('../middleware/auth')
const upload = require('../middleware/caseUpload')
const doctorUpload = require('../middleware/caseDoctorUpload')
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

function startOfLocalDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate())
}

/**
 * Block a second new case with the same doctor while an earlier one is still "active"
 * (visit day not yet passed) and not cancelled. Declined drafts require resubmit, not POST /.
 */
function findBlockingCaseForPatientDoctor(cases, { excludeCaseId } = {}) {
  const today = startOfLocalDay(new Date())
  for (const c of cases) {
    if (excludeCaseId && String(c._id) === String(excludeCaseId)) continue
    if (c.isCancelledByPatient) continue

    const apt = startOfLocalDay(new Date(c.appointmentDate))
    if (apt < today) continue

    if (c.caseStatus === 'draft' && c.doctorReviewStatus === 'rejected') {
      return {
        blocked: true,
        message:
          'You have a declined draft with this dermatologist. Open My cases and use Resubmit to schedule again — you cannot start a duplicate booking.',
      }
    }

    if (c.doctorReviewStatus === 'pending' || c.doctorReviewStatus === 'accepted') {
      return {
        blocked: true,
        message:
          'You already have an open case with this dermatologist before your visit date. Cancel that request or wait until after the scheduled visit to book again.',
      }
    }
  }
  return { blocked: false }
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

    const existingForDoctor = await MedicalCase.find({ patient: req.user.id, doctor: doctorId })
    const block = findBlockingCaseForPatientDoctor(existingForDoctor, {})
    if (block.blocked) {
      return res.status(400).json({ message: block.message })
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

    let pm = paymentMethod
    if (pm === 'cod' || pm === 'cash') pm = 'in_clinic'
    if (!['online', 'in_clinic'].includes(pm)) {
      return res.status(400).json({ message: 'Payment method must be online or in_clinic' })
    }

    let paymentStatus = 'pending_clinic'
    if (pm === 'online') {
      paymentStatus = 'paid'
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
      paymentMethod: pm,
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

/** Resubmit a declined draft to another dermatologist (reuses questionnaire/images on server) */
router.post('/resubmit/:caseId', auth(['patient']), async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }

    const {
      doctorId,
      appointmentDate,
      appointmentTimeSlot,
      consultationFee,
      paymentMethod,
    } = req.body

    let pm = paymentMethod
    if (pm === 'cod' || pm === 'cash') pm = 'in_clinic'
    if (!['online', 'in_clinic'].includes(pm)) {
      return res.status(400).json({ message: 'Payment method must be online or in_clinic' })
    }

    const c = await MedicalCase.findOne({ _id: caseId, patient: req.user.id })
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (c.caseStatus !== 'draft' || c.doctorReviewStatus !== 'rejected') {
      return res.status(400).json({ message: 'Only declined draft cases can be resubmitted' })
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'dermatologist' })
    if (!doctor) {
      return res.status(404).json({ message: 'Dermatologist not found' })
    }

    c.doctor = doctorId
    c.appointmentDate = new Date(appointmentDate)
    c.appointmentTimeSlot = appointmentTimeSlot
    c.consultationFee = Number(consultationFee) || doctor.consultationFee || 0

    if (c.paymentStatus === 'paid') {
      // No second charge (e.g. prior online payment)
    } else {
      c.paymentMethod = pm
      c.paymentStatus = pm === 'online' ? 'paid' : 'pending_clinic'
    }

    c.caseStatus = 'submitted'
    c.doctorReviewStatus = 'pending'
    c.isCancelledByPatient = false
    c.doctorRejectionComment = ''
    c.doctorTomorrowReminderAptYmd = ''

    await c.save()

    const populated = await MedicalCase.findById(c._id)
      .populate('doctor', 'name email specialty')
      .populate('patient', 'name email')
      .lean()

    try {
      await notifyUser(doctor._id, {
        title: 'New pre-appointment case',
        message: `${populated.patient?.name || 'A patient'} resubmitted a case for review before an appointment.`,
        link: '/dermatologist/appointments',
        type: 'case_submitted',
      })
    } catch (e) {
      console.error('notifyUser doctor resubmit:', e)
    }

    res.json({ message: 'Resubmitted', case: populated })
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
    const list = await MedicalCase.find({
      doctor: req.user.id,
      caseStatus: { $ne: 'draft' },
    })
      .populate('patient', 'name email profilePhoto phoneNumber location age gender')
      .sort({ createdAt: -1 })
      .lean()
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

/** Whether patient may start a new booking (POST /cases) with this doctor; optional excludeCaseId for draft resubmit */
router.get('/can-book/:doctorId', auth(['patient']), async (req, res) => {
  try {
    const doctorId = String(req.params.doctorId || '').trim()
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor id' })
    }
    const excludeRaw = req.query.excludeCaseId
    const excludeCaseId =
      excludeRaw && mongoose.Types.ObjectId.isValid(String(excludeRaw)) ? String(excludeRaw) : undefined

    const cases = await MedicalCase.find({ patient: req.user.id, doctor: doctorId })
    const r = findBlockingCaseForPatientDoctor(cases, { excludeCaseId })
    res.json({ allowed: !r.blocked, message: r.blocked ? r.message : '' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Case details (patient or assigned dermatologist)
router.get('/:caseId', auth(['patient', 'dermatologist']), async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }

    const c = await MedicalCase.findById(caseId)
      .populate('patient', 'name email profilePhoto phoneNumber location age gender')
      .populate('doctor', 'name email specialty profilePhoto consultationFee')
      .lean()

    if (!c) return res.status(404).json({ message: 'Case not found' })

    const uid = String(req.user.id)
    if (req.user.role === 'patient' && String(c.patient?._id || c.patient) !== uid) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }
    if (req.user.role === 'dermatologist' && String(c.doctor?._id || c.doctor) !== uid) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    res.json(c)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Doctor upload (reports/comparisons attachments)
router.post('/:caseId/doctor-upload', auth(['dermatologist']), doctorUpload.single('file'), async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }
    const c = await MedicalCase.findById(caseId).lean()
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const filePath = relPath(req.file.path)
    res.json({ filePath, originalName: req.file.originalname || '' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:caseId/notes', auth(['dermatologist']), async (req, res) => {
  try {
    const { text } = req.body
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'text is required' })
    }

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    c.clinicalNotes = c.clinicalNotes || []
    c.clinicalNotes.unshift({ text: String(text).trim(), createdBy: req.user.id })
    await c.save()
    res.json({ message: 'Note added' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:caseId/reports', auth(['dermatologist']), async (req, res) => {
  try {
    const { title, description = '', filePath = '' } = req.body
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'title is required' })
    }

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    c.reports = c.reports || []
    c.reports.unshift({
      title: String(title).trim(),
      description: String(description || ''),
      filePath: String(filePath || ''),
      createdBy: req.user.id,
    })
    await c.save()
    res.json({ message: 'Report added' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:caseId/comparisons', auth(['dermatologist']), async (req, res) => {
  try {
    const { beforePath, afterPath } = req.body
    if (!beforePath || !afterPath) {
      return res.status(400).json({ message: 'beforePath and afterPath are required' })
    }

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    c.comparisons = c.comparisons || []
    c.comparisons.unshift({ beforePath, afterPath, createdBy: req.user.id })
    await c.save()
    res.json({ message: 'Comparison added' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:caseId/followups', auth(['dermatologist']), async (req, res) => {
  try {
    const { date, timeSlot, reason = 'Follow-up' } = req.body
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'date and timeSlot are required' })
    }

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    c.followUps = c.followUps || []
    c.followUps.unshift({
      date: new Date(date),
      timeSlot: String(timeSlot),
      reason: String(reason || 'Follow-up'),
      createdBy: req.user.id,
    })
    await c.save()

    try {
      await notifyUser(c.patient, {
        title: 'Follow-up scheduled',
        message: `Your dermatologist scheduled a follow-up on ${new Date(date).toDateString()} at ${timeSlot}.`,
        link: '/patient/appointments',
        type: 'followup_scheduled',
      })
    } catch (e) {
      console.error('notify followup:', e)
    }

    res.json({ message: 'Follow-up scheduled' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:caseId/treatment-plan', auth(['dermatologist']), async (req, res) => {
  try {
    const { medications = [], lifestyle = [], notes = '' } = req.body || {}

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const meds = Array.isArray(medications) ? medications : []
    const life = Array.isArray(lifestyle) ? lifestyle : []

    c.treatmentPlan = {
      medications: meds
        .filter((m) => m && m.name)
        .map((m) => ({
          name: String(m.name),
          dosage: String(m.dosage || ''),
          duration: String(m.duration || ''),
        })),
      lifestyle: life.map(String),
      notes: String(notes || ''),
      updatedAt: new Date(),
      updatedBy: req.user.id,
    }
    await c.save()

    try {
      await notifyUser(c.patient, {
        title: 'Treatment plan updated',
        message: 'Your dermatologist updated your treatment plan.',
        link: '/patient/treatment',
        type: 'treatment_plan',
      })
    } catch (e) {
      console.error('notify treatment plan:', e)
    }

    res.json({ message: 'Treatment plan saved' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

async function patchDoctorReview(req, res) {
  try {
    const { decision, comment } = req.body
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

    if (decision === 'rejected') {
      c.caseStatus = 'draft'
      c.doctorTomorrowReminderAptYmd = ''
      const text = typeof comment === 'string' ? comment.trim().slice(0, 1000) : ''
      c.doctorRejectionComment = text
    } else {
      c.caseStatus = 'submitted'
      c.doctorRejectionComment = ''
      c.doctorTomorrowReminderAptYmd = ''
    }

    c.doctorReviewStatus = decision
    await c.save()

    const doctor = await User.findById(doctorId).select('name')
    const dname = doctor?.name || 'Your dermatologist'

    if (decision === 'accepted') {
      try {
        await notifyUser(c.patient, {
          title: 'Case accepted',
          message: `Dr. ${dname} accepted your pre-appointment case.`,
          link: '/patient/appointments',
          type: 'case_review',
        })
      } catch (e) {
        console.error('notify patient review:', e)
      }
    } else {
      let msg = `Dr. ${dname} declined your request. Your case is saved as a draft in My cases — you can send it to another doctor without redoing screenings.`
      if (c.doctorRejectionComment) {
        msg += ` Reason: ${c.doctorRejectionComment}`
      }
      try {
        await notifyUser(c.patient, {
          title: 'Case declined',
          message: msg,
          link: '/patient/cases',
          type: 'case_declined_draft',
        })
      } catch (e) {
        console.error('notify patient review:', e)
      }
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
    if (c.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Already marked paid' })
    }
    const pm = c.paymentMethod
    if (pm === 'online') {
      return res.status(400).json({ message: 'Online payments are recorded at submission' })
    }
    if (!['in_clinic', 'cod', 'cash'].includes(pm)) {
      return res.status(400).json({ message: 'Mark paid is only for in-clinic payment' })
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
