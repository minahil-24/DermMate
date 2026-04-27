const express = require('express')
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const MedicalCase = require('../models/Case')
const User = require('../models/User')
const auth = require('../middleware/auth')
const checkBlock = require('../middleware/checkBlock')
const upload = require('../middleware/caseUpload')
const doctorUpload = require('../middleware/caseDoctorUpload')
const { notifyUser } = require('../utils/notify')
const { stripAffectedAiForPatient, stripAffectedAiForPatientList } = require('../utils/caseSanitize')
const { processHairAffectedUpload, buildAffectedImagesWithHairAnalysis } = require('../utils/yoloAlopecia')
const { isDoctorSlotTaken, getDoctorBookedSlots } = require('../utils/appointmentSlots')

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
    const isAffected = req.query.type === 'affected'
    // Multipart body field (reliable); query can be dropped by some proxies / clients
    const complaintType = String(
      req.query.complaintType || req.body.complaintType || ''
    )
      .trim()
      .toLowerCase()

    if (isAffected && complaintType === 'hair') {
      try {
        const hair = await processHairAffectedUpload(req.file, backendRoot)
        if (!hair.ok) {
          try {
            fs.unlinkSync(req.file.path)
          } catch (_) { }
          const raw = hair.raw || {}
          return res.status(400).json({
            message:
              raw.message ||
              'Image did not pass automated checks for hair/scalp photos. Please try another photo.',
            code: 'alopecia_image_rejected',
          })
        }
      } catch (e) {
        try {
          fs.unlinkSync(req.file.path)
        } catch (_) { }
        console.error('Hair YOLO upload:', e.message)
        return res.status(503).json({
          message:
            'Hair image analysis is unavailable. Start the alopecia AI service from the yolo_system/backend folder (python main.py), or set YOLO_ALOPECIA_URL to your API base URL.',
        })
      }
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
      paymentStatus = 'pending_online'
    }

    const slotTaken = await isDoctorSlotTaken(
      MedicalCase,
      doctorId,
      appointmentDate,
      appointmentTimeSlot,
      null
    )
    if (slotTaken) {
      return res.status(409).json({
        message:
          'This appointment slot is no longer available. Please choose another date or time for this dermatologist.',
        code: 'slot_unavailable',
      })
    }

    const affectedWithAi = await buildAffectedImagesWithHairAnalysis(aff, complaintType, backendRoot)

    const doc = new MedicalCase({
      patient: req.user.id,
      doctor: doctorId,
      complaintType,
      questionnaire: questionnaire || {},
      medicalHistoryFiles: med.map((f) => ({
        filePath: f.filePath,
        originalName: f.originalName || '',
      })),
      affectedImages: affectedWithAi,
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

    res.status(201).json({
      message: 'Case submitted',
      case: stripAffectedAiForPatient(populated),
    })
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

    const slotTaken = await isDoctorSlotTaken(
      MedicalCase,
      doctorId,
      appointmentDate,
      appointmentTimeSlot,
      caseId
    )
    if (slotTaken) {
      return res.status(409).json({
        message:
          'This appointment slot is no longer available. Please choose another date or time for this dermatologist.',
        code: 'slot_unavailable',
      })
    }

    if (c.paymentStatus === 'paid') {
      // No second charge (e.g. prior online payment)
    } else {
      c.paymentMethod = pm
      c.paymentStatus = pm === 'online' ? 'pending_online' : 'pending_clinic'
    }

    c.caseStatus = 'submitted'
    c.doctorReviewStatus = 'pending'
    c.doctorAcceptedAt = null
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

    res.json({ message: 'Resubmitted', case: stripAffectedAiForPatient(populated) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

/** Delete a declined draft case (patient-owned) */
router.delete('/draft/:caseId', auth(['patient']), async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.patient) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }
    if (c.caseStatus !== 'draft' || c.doctorReviewStatus !== 'rejected') {
      return res.status(400).json({ message: 'Only declined draft cases can be deleted' })
    }

    await c.deleteOne()
    res.json({ message: 'Draft case deleted' })
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
    res.json(stripAffectedAiForPatientList(list))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/doctor/incoming', auth(['dermatologist']), checkBlock, async (req, res) => {
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

/** Booked date+time slots for a doctor (patient scheduling UI). */
router.get('/doctor/:doctorId/booked-slots', auth(['patient']), async (req, res) => {
  try {
    const doctorId = String(req.params.doctorId || '').trim()
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor id' })
    }
    const days = Math.min(90, Math.max(7, parseInt(String(req.query.days || '45'), 10) || 45))
    const booked = await getDoctorBookedSlots(MedicalCase, doctorId, days)
    res.json({ booked })
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

    if (req.user.role === 'patient') {
      return res.json(stripAffectedAiForPatient(c))
    }
    res.json(c)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Doctor upload (reports/comparisons attachments)
router.post('/:caseId/doctor-upload', auth(['dermatologist']), checkBlock, doctorUpload.single('file'), async (req, res) => {
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

router.post('/:caseId/notes', auth(['dermatologist']), checkBlock, async (req, res) => {
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

router.patch('/:caseId/notes/:noteId', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const { text } = req.body || {}
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'text is required' })
    }

    const caseId = String(req.params.caseId || '').trim()
    const noteId = String(req.params.noteId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId) || !noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: 'Invalid case id or note id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const note = (c.clinicalNotes || []).id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.text = String(text).trim()

    await c.save()
    res.json({ message: 'Note updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/:caseId/notes/:noteId', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    const noteId = String(req.params.noteId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId) || !noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: 'Invalid case id or note id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const note = (c.clinicalNotes || []).id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.deleteOne()

    await c.save()
    res.json({ message: 'Note deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Compatibility aliases for clients/environments that cannot use PATCH/DELETE reliably.
router.post('/:caseId/notes/:noteId/update', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const { text } = req.body || {}
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'text is required' })
    }

    const caseId = String(req.params.caseId || '').trim()
    const noteId = String(req.params.noteId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId) || !noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: 'Invalid case id or note id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const note = (c.clinicalNotes || []).id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.text = String(text).trim()
    await c.save()

    res.json({ message: 'Note updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:caseId/notes/:noteId/delete', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    const noteId = String(req.params.noteId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId) || !noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: 'Invalid case id or note id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const note = (c.clinicalNotes || []).id(noteId)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    note.deleteOne()
    await c.save()

    res.json({ message: 'Note deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/:caseId/reports', auth(['dermatologist']), checkBlock, async (req, res) => {
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

router.post('/:caseId/comparisons', auth(['dermatologist']), checkBlock, async (req, res) => {
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

router.post('/:caseId/followups', auth(['dermatologist']), checkBlock, async (req, res) => {
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

router.patch('/:caseId/followups/:followUpId', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const { date, timeSlot, reason = 'Follow-up' } = req.body || {}
    if (!date || !timeSlot) {
      return res.status(400).json({ message: 'date and timeSlot are required' })
    }

    const caseId = String(req.params.caseId || '').trim()
    const followUpId = String(req.params.followUpId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId) || !followUpId || !mongoose.Types.ObjectId.isValid(followUpId)) {
      return res.status(400).json({ message: 'Invalid case id or follow-up id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const follow = (c.followUps || []).id(followUpId)
    if (!follow) return res.status(404).json({ message: 'Follow-up not found' })

    follow.date = new Date(date)
    follow.timeSlot = String(timeSlot)
    follow.reason = String(reason || 'Follow-up')
    await c.save()

    res.json({ message: 'Follow-up updated' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/:caseId/followups/:followUpId', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    const followUpId = String(req.params.followUpId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId) || !followUpId || !mongoose.Types.ObjectId.isValid(followUpId)) {
      return res.status(400).json({ message: 'Invalid case id or follow-up id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const follow = (c.followUps || []).id(followUpId)
    if (!follow) return res.status(404).json({ message: 'Follow-up not found' })
    follow.deleteOne()
    await c.save()

    res.json({ message: 'Follow-up deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/:caseId/status/start', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const caseId = String(req.params.caseId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }
    if (c.isCancelledByPatient) {
      return res.status(400).json({ message: 'Case was cancelled by patient' })
    }
    if (c.doctorReviewStatus !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted cases can be started' })
    }
    const today = startOfLocalDay(new Date())
    const appointmentDay = startOfLocalDay(new Date(c.appointmentDate))
    if (appointmentDay.getTime() !== today.getTime()) {
      return res.status(400).json({ message: 'Case can only be started on the appointment date' })
    }

    c.caseStatus = 'started'
    if (c.closure) {
      c.closure.reason = ''
      c.closure.note = ''
      c.closure.closedAt = null
      c.closure.closedBy = null
    }
    await c.save()
    res.json({ message: 'Case started', caseStatus: c.caseStatus })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/:caseId/status/close', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const { reason = '', note = '' } = req.body || {}
    const allowedReasons = ['no_show', 'treatment_completed', 'other']
    if (!allowedReasons.includes(String(reason))) {
      return res.status(400).json({ message: 'A valid closure reason is required' })
    }
    if (String(reason) === 'other' && !String(note || '').trim()) {
      return res.status(400).json({ message: 'Please provide a note for "Other" closure reason' })
    }

    const caseId = String(req.params.caseId || '').trim()
    if (!caseId || !mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: 'Invalid case id' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    if ((c.followUps || []).length > 0) {
      return res.status(400).json({ message: 'Cannot close case while follow-up appointments exist' })
    }

    const today = startOfLocalDay(new Date())
    const appointmentDay = startOfLocalDay(new Date(c.appointmentDate))
    if (appointmentDay > today) {
      return res.status(400).json({ message: 'Case can be closed on or after the appointment date' })
    }

    c.caseStatus = 'closed'
    c.closure = {
      reason: String(reason),
      note: String(note || '').trim(),
      closedAt: new Date(),
      closedBy: req.user.id,
    }
    await c.save()

    const reasonLabelMap = {
      no_show: 'Patient did not show up',
      treatment_completed: 'Treatment completed',
      other: 'Other',
    }
    const reasonLabel = reasonLabelMap[String(reason)] || 'Case closed'

    try {
      await notifyUser(c.patient, {
        title: 'Case closed',
        message: `Your dermatologist has closed your case. Reason: ${reasonLabel}${String(note || '').trim() ? ` (${String(note || '').trim()})` : ''}`,
        link: '/patient/treatment',
        type: 'case_closed',
      })
    } catch (e) {
      console.error('notify case closed:', e)
    }

    res.json({ message: 'Case closed', caseStatus: c.caseStatus })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/:caseId/progress', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const { progress } = req.body
    if (progress === undefined) return res.status(400).json({ message: 'Progress is required' })

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    c.progress = Math.min(100, Math.max(0, parseInt(progress, 10) || 0))
    await c.save()

    try {
      await notifyUser(c.patient, {
        title: 'Treatment Progress Updated',
        message: `Your dermatologist updated your treatment progress to ${c.progress}%.`,
        link: '/patient/dashboard',
        type: 'treatment_progress',
      })
    } catch (e) {
      console.error('notify progress update:', e)
    }

    res.json({ message: 'Progress updated', progress: c.progress })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:caseId/treatment-plan', auth(['dermatologist']), checkBlock, async (req, res) => {
  try {
    const { name = '', medications = [], lifestyle = [], notes = '', progress } = req.body || {}

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    const meds = Array.isArray(medications) ? medications : []
    const life = Array.isArray(lifestyle) ? lifestyle : []

    if (progress !== undefined) {
      c.progress = Math.min(100, Math.max(0, parseInt(progress, 10) || 0))
    }

    c.treatmentPlan = {
      name: String(name || '').trim(),
      medications: meds
        .filter((m) => m && m.name)
        .map((m) => ({
          name: String(m.name),
          dosage: String(m.dosage || ''),
          timesPerDay: Math.max(1, parseInt(m.timesPerDay, 10) || 1),
          durationDays: Math.max(0, parseInt(m.durationDays, 10) || 0),
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
    const currentStatus = c.doctorReviewStatus || 'pending'
    const acceptedAtMs = c.doctorAcceptedAt
      ? new Date(c.doctorAcceptedAt).getTime()
      : new Date(c.updatedAt).getTime()
    const canDeclineAcceptedWithinWindow =
      currentStatus === 'accepted' &&
      decision === 'rejected' &&
      !Number.isNaN(acceptedAtMs) &&
      (Date.now() - acceptedAtMs) <= 24 * 60 * 60 * 1000

    if (currentStatus !== 'pending' && !canDeclineAcceptedWithinWindow) {
      if (currentStatus === 'accepted' && decision === 'rejected') {
        return res.status(400).json({ message: 'You can decline an accepted case only within 24 hours of accepting it' })
      }
      return res.status(400).json({ message: 'Case already reviewed' })
    }

    if (decision === 'rejected') {
      c.caseStatus = 'draft'
      c.doctorTomorrowReminderAptYmd = ''
      const text = typeof comment === 'string' ? comment.trim().slice(0, 1000) : ''
      c.doctorRejectionComment = text
      c.doctorAcceptedAt = null
    } else {
      c.caseStatus = 'submitted'
      c.doctorRejectionComment = ''
      c.doctorTomorrowReminderAptYmd = ''
      c.doctorAcceptedAt = new Date()
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
      const wasAcceptedBefore = currentStatus === 'accepted'
      let msg = wasAcceptedBefore
        ? `Dr. ${dname} declined your case within 24 hours of accepting it. Your case is saved as a draft in My cases — you can send it to another doctor without redoing screenings.`
        : `Dr. ${dname} declined your request. Your case is saved as a draft in My cases — you can send it to another doctor without redoing screenings.`
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
router.patch('/review/:caseId', auth(['dermatologist']), checkBlock, patchDoctorReview)
router.patch('/:caseId/review', auth(['dermatologist']), checkBlock, patchDoctorReview)

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
    res.json({ message: 'Cancelled', case: stripAffectedAiForPatient(populated) })
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

    res.json({ message: 'Payment recorded', case: stripAffectedAiForPatient(populated) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

/** Submit review and rating for a closed case (patient-only) */
router.post('/:caseId/review', auth(['patient']), async (req, res) => {
  try {
    const { rating, comment } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'A rating between 1 and 5 is required' })
    }

    const c = await MedicalCase.findById(req.params.caseId)
    if (!c) return res.status(404).json({ message: 'Case not found' })
    if (String(c.patient) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }
    if (c.caseStatus !== 'closed') {
      return res.status(400).json({ message: 'Reviews can only be given for closed cases' })
    }
    if (c.review && c.review.rating) {
      return res.status(400).json({ message: 'You have already reviewed this case' })
    }

    c.review = {
      rating: Number(rating),
      comment: String(comment || '').trim(),
      createdAt: new Date()
    }
    await c.save()

    // Update doctor's aggregate rating
    const doctor = await User.findById(c.doctor)
    if (doctor) {
      const allDoctorCases = await MedicalCase.find({ 
        doctor: doctor._id, 
        'review.rating': { $ne: null } 
      })
      const totalRatings = allDoctorCases.length
      const sumRatings = allDoctorCases.reduce((sum, curr) => sum + curr.review.rating, 0)
      
      doctor.totalReviews = totalRatings
      doctor.averageRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(1)) : 0
      await doctor.save()

      // Notify doctor
      try {
        const patientName = req.user.name || 'A patient'
        await notifyUser(doctor._id, {
          title: 'New Review Received',
          message: `${patientName} gave you a ${rating}-star rating and a review.`,
          link: '/dermatologist/dashboard',
          type: 'review_received',
        })
      } catch (e) {
        console.error('Notify review error:', e)
      }
    }

    res.json({ message: 'Review submitted successfully', review: c.review })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
