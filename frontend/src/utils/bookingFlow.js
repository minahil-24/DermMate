const KEY = 'dermmate_booking_v1'

export function loadBooking() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function mergeBooking(partial) {
  const cur = loadBooking()
  const next = { ...cur, ...partial }
  sessionStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearBooking() {
  sessionStorage.removeItem(KEY)
}

/**
 * Draft resubmit: skip complaint / questionnaire / uploads and go straight to schedule.
 * Uses draftCaseId + doctorId from React Router state or sessionStorage.
 * @returns {boolean} true if navigation was performed
 */
export function redirectDraftResubmitToSchedule(navigate, location) {
  const b = loadBooking()
  const draftId = location?.state?.draftCaseId || b.draftCaseId
  if (!draftId) return false
  const doctorId = location?.state?.doctorId || b.doctorId
  if (!doctorId) return false
  mergeBooking({ draftCaseId: draftId, doctorId })
  navigate('/patient/booking/schedule', {
    replace: true,
    state: {
      doctorId,
      doctorName: location?.state?.doctorName || b.doctorName,
      draftCaseId: draftId,
      bookingFlow: true,
    },
  })
  return true
}
