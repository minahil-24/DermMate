const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const { backendRoot } = require('./uploadPaths')

const LOGO_PATH = path.join(backendRoot, 'assets', 'logoo.png')
const REPORTS_DIR = path.join(backendRoot, 'uploads', 'followup-reports')

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }
}

function formatDate(d) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(d) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeSlot(slot) {
  if (!slot) return 'N/A'
  const [hours, minutes] = String(slot).split(':')
  const hour = parseInt(hours, 10)
  if (Number.isNaN(hour)) return slot
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes || '00'} ${ampm}`
}

function complaintLabel(type) {
  if (type === 'hair') return 'Hair / Scalp'
  if (type === 'nails') return 'Nails'
  if (type === 'skin') return 'Skin'
  return type || 'N/A'
}

function drawWatermark(doc) {
  const pageWidth = doc.page.width
  const pageHeight = doc.page.height
  doc.save()
  doc.opacity(0.1)
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 0, 0, {
      cover: [pageWidth, pageHeight],
      align: 'center',
      valign: 'center',
    })
  } else {
    doc.fontSize(72).fillColor('#059669').text('DermMate', 0, pageHeight / 2 - 36, {
      width: pageWidth,
      align: 'center',
    })
  }
  doc.restore()
  doc.opacity(1)
  doc.fillColor('#111827')
}

function sectionTitle(doc, title, y) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#047857').text(title, 50, y)
  doc.moveTo(50, y + 14).lineTo(545, y + 14).strokeColor('#d1fae5').lineWidth(1).stroke()
  return y + 22
}

function bodyText(doc, text, y, options = {}) {
  doc.font('Helvetica').fontSize(9).fillColor('#374151')
  doc.text(text || 'N/A', 50, y, { width: 495, lineGap: 1, ...options })
  return doc.y + 4
}

function questionnaireSummary(questionnaire) {
  if (!questionnaire || typeof questionnaire !== 'object') return 'No questionnaire data recorded.'
  const lines = []
  for (const [key, value] of Object.entries(questionnaire)) {
    if (value == null || value === '') continue
    const label = String(key)
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim()
    const val = Array.isArray(value) ? value.join(', ') : String(value)
    lines.push(`${label}: ${val}`)
  }
  return lines.length ? lines.join('\n') : 'No questionnaire data recorded.'
}

function treatmentSummary(plan) {
  if (!plan) return 'No treatment plan recorded.'
  const parts = []
  if (plan.name) parts.push(`Plan: ${plan.name}`)
  if ((plan.medications || []).length) {
    parts.push(
      plan.medications
        .map((m) => {
          const dose = [m.name, m.dosage].filter(Boolean).join(' — ')
          const schedule = [
            m.timesPerDay ? `${m.timesPerDay}x daily` : '',
            m.duration || (m.durationDays ? `${m.durationDays} days` : ''),
          ]
            .filter(Boolean)
            .join(', ')
          return `• ${dose}${schedule ? ` (${schedule})` : ''}`
        })
        .join('\n')
    )
  }
  if ((plan.lifestyle || []).length) {
    parts.push(plan.lifestyle.map((l) => `• ${l}`).join('\n'))
  }
  if (plan.notes) parts.push(`Notes: ${plan.notes}`)
  return parts.length ? parts.join('\n') : 'No treatment plan recorded.'
}

/**
 * Generate a single-page follow-up PDF report and return relative file path.
 */
async function generateFollowUpReport({ caseDoc, followUp, patient, doctor, submittedAt }) {
  ensureReportsDir()

  const fileName = `followup-report-${caseDoc._id}-${followUp._id}-${Date.now()}.pdf`
  const absOut = path.join(REPORTS_DIR, fileName)
  const relOut = path.relative(backendRoot, absOut).replace(/\\/g, '/')

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true })
    const stream = fs.createWriteStream(absOut)

    stream.on('finish', () => resolve(relOut))
    stream.on('error', reject)
    doc.on('error', reject)
    doc.pipe(stream)

    drawWatermark(doc)

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#065f46').text('DermMate', 50, 45)
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('Official Medical Follow-Up Report', 50, 66)
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151').text(
      `Report ID: ${String(followUp._id).slice(-8).toUpperCase()}`,
      50,
      80
    )
    doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(
      `Generated: ${formatDateTime(submittedAt || new Date())}`,
      350,
      80,
      { width: 195, align: 'right' }
    )

    let y = 98

    y = sectionTitle(doc, 'Patient Information', y)
    y = bodyText(doc, `Name: ${patient?.name || 'N/A'}   |   Email: ${patient?.email || 'N/A'}`)
    y = bodyText(doc, `Age: ${patient?.age ?? 'N/A'}   |   Gender: ${patient?.gender || 'N/A'}   |   Phone: ${patient?.phoneNumber || 'N/A'}`)
    y = bodyText(doc, `Location: ${patient?.location || 'N/A'}`)

    y += 4
    y = sectionTitle(doc, 'Disease / Condition Details', y)
    y = bodyText(doc, `Primary complaint: ${complaintLabel(caseDoc.complaintType)}   |   Progress: ${caseDoc.progress ?? 0}%`)
    y = bodyText(doc, questionnaireSummary(caseDoc.questionnaire))

    y += 4
    y = sectionTitle(doc, 'Follow-Up Information', y)
    y = bodyText(doc, `Scheduled: ${formatDate(followUp.date)} at ${formatTimeSlot(followUp.timeSlot)}`)
    y = bodyText(doc, `Reason: ${followUp.reason || 'Follow-up'}`)
    y = bodyText(doc, `Submitted: ${formatDateTime(submittedAt || new Date())}`)

    y += 4
    y = sectionTitle(doc, 'Dermatologist Information', y)
    y = bodyText(doc, `Dr. ${doctor?.name || 'N/A'}   |   ${doctor?.specialty || 'Dermatology'}`)
    y = bodyText(doc, `Degree: ${doctor?.degree || 'N/A'}   |   Email: ${doctor?.email || 'N/A'}`)

    y += 4
    y = sectionTitle(doc, 'Treatment Plan & Recommendations', y)
    bodyText(doc, treatmentSummary(caseDoc.treatmentPlan))

    doc.font('Helvetica').fontSize(8).fillColor('#9ca3af').text(
      'DermMate Confidential Medical Document',
      50,
      doc.page.height - 40,
      { width: 495, align: 'center' }
    )

    doc.end()
  })
}

module.exports = { generateFollowUpReport }
