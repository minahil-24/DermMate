export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

/** Match backend slot normalization (avoid duplicate bookings for "9:00" vs "09:00"). */
export const normalizeAppointmentSlot = (s) => {
  if (s == null) return ''
  const t = String(s).trim()
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t.replace(/\s+/g, '').toLowerCase()
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10) || 0))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10) || 0))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export const isSlotBooked = (bookedList, dateStr, timeStr) => {
  const slot = normalizeAppointmentSlot(timeStr)
  if (!dateStr || !slot) return false
  return (bookedList || []).some(
    (b) => b.date === dateStr && normalizeAppointmentSlot(b.slot) === slot
  )
}

export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(1)
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
  }
}

import jsPDF from 'jspdf'

export const generateChallanPDF = ({ patient, doctor, paymentMethod, fee, date, timeSlot }) => {
  const doc = new jsPDF('p', 'pt', 'a4')

  const lineHeight = 20
  let y = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Appointment Challan', 40, y)

  y += lineHeight * 2
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Details', 40, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${patient?.name || 'N/A'}`, 40, y)
  doc.text(`Email: ${patient?.email || 'N/A'}`, 300, y)
  y += lineHeight

  y += lineHeight
  doc.setFont('helvetica', 'bold')
  doc.text('Dermatologist Details', 40, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.text(`Dr. Name: ${doctor?.name || 'N/A'}`, 40, y)
  doc.text(`Specialty: ${doctor?.specialty || 'Dermatologist'}`, 300, y)
  y += lineHeight

  y += lineHeight
  doc.setFont('helvetica', 'bold')
  doc.text('Appointment & Payment', 40, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.text(`Date & Time: ${date ? new Date(date).toLocaleDateString() : 'N/A'} at ${timeSlot || 'N/A'}`, 40, y)
  y += lineHeight
  doc.text(`Consultation Fee: PKR ${fee || 0}`, 40, y)
  y += lineHeight
  doc.text(`Payment Method: ${paymentMethod === 'in_clinic' ? 'Pay at Clinic' : paymentMethod}`, 40, y)
  y += lineHeight
  doc.text(`Status: Pending Payment At Clinic`, 40, y)

  doc.setLineWidth(0.5)
  doc.line(40, y + 20, 555, y + 20)

  doc.save('appointment_challan.pdf')
}
