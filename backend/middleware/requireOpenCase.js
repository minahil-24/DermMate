/**
 * Block dermatologist write operations on closed cases.
 * Use after auth + checkBlock on mutating case routes (not on close/restart/GET).
 */
const MedicalCase = require('../models/Case')

async function requireOpenCase(req, res, next) {
  try {
    const caseId = String(req.params.caseId || req.params.id || '').trim()
    if (!caseId) {
      return res.status(400).json({ message: 'Case id is required' })
    }

    const c = await MedicalCase.findById(caseId)
    if (!c) {
      return res.status(404).json({ message: 'Case not found' })
    }

    if (req.user?.role === 'dermatologist' && String(c.doctor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized for this case' })
    }

    if (c.caseStatus === 'closed') {
      return res.status(400).json({
        message: 'This case is closed. Restart the case to make changes.',
        code: 'CASE_CLOSED',
      })
    }

    req.medicalCase = c
    next()
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = requireOpenCase
