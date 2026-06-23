const express = require('express')
const path = require('path')
const User = require('../models/User')
const auth = require('../middleware/auth')
const upload = require('../middleware/caseUpload')
const { backendRoot, unlinkStoredFile } = require('../utils/uploadPaths')

const router = express.Router()

function relPath(absPath) {
  return path.relative(backendRoot, absPath).replace(/\\/g, '/')
}

router.get('/', auth(['patient']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('savedMedicalRecords')
    if (!user) return res.status(404).json({ message: 'User not found' })
    const records = (user.savedMedicalRecords || []).sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    )
    res.json({ success: true, records })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/upload', auth(['patient']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const filePath = relPath(req.file.path)
    const originalName = req.file.originalname || ''
    const title = String(req.body.title || '').trim() || originalName || 'Medical record'

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.savedMedicalRecords.push({
      filePath,
      originalName,
      title,
      uploadedAt: new Date(),
    })
    await user.save()

    const record = user.savedMedicalRecords[user.savedMedicalRecords.length - 1]
    res.status(201).json({ success: true, record })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/:recordId', auth(['patient']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const recordId = String(req.params.recordId || '').trim()
    const record = user.savedMedicalRecords.find((r) => String(r._id) === recordId)
    if (!record) return res.status(404).json({ message: 'Record not found' })

    const title = String(req.body.title || '').trim()
    if (title) record.title = title
    await user.save()

    res.json({ success: true, record })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/:recordId', auth(['patient']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const recordId = String(req.params.recordId || '').trim()
    const idx = user.savedMedicalRecords.findIndex((r) => String(r._id) === recordId)
    if (idx === -1) return res.status(404).json({ message: 'Record not found' })

    const filePath = user.savedMedicalRecords[idx].filePath
    user.savedMedicalRecords.splice(idx, 1)
    await user.save()
    unlinkStoredFile(filePath)

    res.json({ success: true, message: 'Record deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
