const express = require('express')
const Notification = require('../models/Notification')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth(), async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/:id/read', auth(), async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    )
    if (!n) return res.status(404).json({ message: 'Notification not found' })
    res.json(n)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/read-all', auth(), async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true })
    res.json({ message: 'All marked read' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/broadcast', auth(['admin']), async (req, res) => {
  try {
    const { title, message, target } = req.body
    if (!title || !message) return res.status(400).json({ message: 'Title and message required' })

    const User = require('../models/User')
    let query = {}
    if (target === 'patients') query = { role: 'patient' }
    else if (target === 'dermatologists') query = { role: 'dermatologist' }
    else if (target === 'all') query = { role: { $in: ['patient', 'dermatologist'] } }
    else return res.status(400).json({ message: 'Invalid target' })

    const users = await User.find(query).select('_id')
    const notifications = users.map(u => ({
      recipient: u._id,
      title,
      message,
      type: 'broadcast'
    }))

    await Notification.insertMany(notifications)
    res.json({ message: `Broadcast sent to ${users.length} users` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
