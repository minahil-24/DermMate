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
