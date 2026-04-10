const { DateTime } = require('luxon')
const MedicalCase = require('../models/Case')
const User = require('../models/User')
const { notifyUser } = require('../utils/notify')

function defaultTimeZone() {
  return (process.env.APP_DEFAULT_TIMEZONE || 'UTC').trim() || 'UTC'
}

/** Calendar YYYY-MM-DD for an instant in a given IANA zone */
function ymdInZone(dateVal, zone) {
  const z = zone || 'UTC'
  try {
    return DateTime.fromJSDate(new Date(dateVal), { zone: 'utc' }).setZone(z).toISODate()
  } catch {
    return DateTime.fromJSDate(new Date(dateVal), { zone: 'utc' }).toISODate()
  }
}

function tomorrowYmdInZone(zone) {
  const z = zone || 'UTC'
  try {
    return DateTime.now().setZone(z).plus({ days: 1 }).toISODate()
  } catch {
    return DateTime.now().plus({ days: 1 }).toISODate()
  }
}

function resolveCaseTimeZone(patientDoc, doctorDoc) {
  const p = (patientDoc?.timeZone || '').trim()
  if (p) return p
  const d = (doctorDoc?.timeZone || '').trim()
  if (d) return d
  return defaultTimeZone()
}

/**
 * Hourly cron: notify assigned dermatologist when patient's visit is the next calendar day in the patient's (else doctor's, else app) timezone.
 */
async function runTomorrowAppointmentReminders() {
  const list = await MedicalCase.find({
    doctorReviewStatus: 'accepted',
    isCancelledByPatient: false,
    caseStatus: { $ne: 'draft' },
  })
    .populate('patient', 'name timeZone')
    .populate('doctor', 'name timeZone')
    .lean()

  for (const row of list) {
    const c = await MedicalCase.findById(row._id)
    if (!c) continue
    if (c.doctorReviewStatus !== 'accepted' || c.isCancelledByPatient || c.caseStatus === 'draft') continue

    const tz = resolveCaseTimeZone(row.patient, row.doctor)
    const aptYmd = ymdInZone(c.appointmentDate, tz)
    const tomYmd = tomorrowYmdInZone(tz)
    if (aptYmd !== tomYmd) continue
    if (c.doctorTomorrowReminderAptYmd === aptYmd) continue

    const patientName = row.patient?.name || 'A patient'
    const msg = `${patientName} has a visit scheduled tomorrow (${aptYmd}). Review the case in Appointments.`

    try {
      await notifyUser(c.doctor, {
        title: 'Appointment tomorrow',
        message: msg,
        link: '/dermatologist/appointments',
        type: 'appointment_tomorrow',
      })
    } catch (e) {
      console.error('tomorrow reminder notify:', e)
      continue
    }

    c.doctorTomorrowReminderAptYmd = aptYmd
    await c.save().catch((err) => console.error('save reminder flag:', err))
  }
}

module.exports = { runTomorrowAppointmentReminders }
