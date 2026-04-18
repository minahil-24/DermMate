const mongoose = require('mongoose')

/**
 * Normalize "9:00" / "09:00" / "09:00:00" → "09:00" for comparison.
 */
function normalizeTimeSlot(s) {
  if (s == null) return ''
  const t = String(s).trim()
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t.replace(/\s+/g, '').toLowerCase()
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10) || 0))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10) || 0))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * Calendar YYYY-MM-DD from client string or from stored Date (date-only values are stored as UTC midnight).
 */
function appointmentDayKeyFromInput(appointmentDate) {
  const s = typeof appointmentDate === 'string' ? appointmentDate.trim() : ''
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const d = new Date(appointmentDate)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function appointmentDayKeyFromDoc(appointmentDateField) {
  const d = new Date(appointmentDateField)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/**
 * Cases that currently hold a doctor time slot (another patient cannot take the same slot).
 */
function slotOccupyingQuery(doctorId) {
  return {
    doctor: doctorId,
    isCancelledByPatient: false,
    doctorReviewStatus: { $in: ['pending', 'accepted'] },
    caseStatus: { $in: ['submitted'] },
  }
}

/**
 * Returns true if another case already uses this doctor + calendar day + time slot.
 */
async function isDoctorSlotTaken(MedicalCase, doctorId, appointmentDate, appointmentTimeSlot, excludeCaseId) {
  const dayKey = appointmentDayKeyFromInput(appointmentDate)
  const slotNorm = normalizeTimeSlot(appointmentTimeSlot)
  if (!dayKey || !slotNorm) return false

  const docs = await MedicalCase.find(slotOccupyingQuery(doctorId)).select('_id appointmentDate appointmentTimeSlot').lean()

  for (const c of docs) {
    if (excludeCaseId && String(c._id) === String(excludeCaseId)) continue
    const dk = appointmentDayKeyFromDoc(c.appointmentDate)
    if (dk === dayKey && normalizeTimeSlot(c.appointmentTimeSlot) === slotNorm) {
      return true
    }
  }
  return false
}

/**
 * Booked slot pairs for UI: { date: 'YYYY-MM-DD', slot: '09:00' } (normalized slot).
 */
function utcTodayYmd() {
  const n = new Date()
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}-${String(n.getUTCDate()).padStart(2, '0')}`
}

async function getDoctorBookedSlots(MedicalCase, doctorId, daysAhead = 45) {
  if (!mongoose.Types.ObjectId.isValid(String(doctorId))) return []

  const now = new Date()
  const startUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const endUtc = startUtc + daysAhead * 24 * 60 * 60 * 1000
  const todayYmd = utcTodayYmd()

  const docs = await MedicalCase.find({
    ...slotOccupyingQuery(doctorId),
    appointmentDate: { $gte: new Date(startUtc - 24 * 60 * 60 * 1000), $lte: new Date(endUtc) },
  })
    .select('appointmentDate appointmentTimeSlot')
    .lean()

  const booked = []
  for (const c of docs) {
    const date = appointmentDayKeyFromDoc(c.appointmentDate)
    const slot = normalizeTimeSlot(c.appointmentTimeSlot)
    if (date && slot && date >= todayYmd) booked.push({ date, slot })
  }
  return booked
}

module.exports = {
  normalizeTimeSlot,
  appointmentDayKeyFromInput,
  appointmentDayKeyFromDoc,
  isDoctorSlotTaken,
  getDoctorBookedSlots,
}
