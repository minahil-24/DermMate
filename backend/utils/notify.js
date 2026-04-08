const Notification = require('../models/Notification')
const User = require('../models/User')

async function notifyUser(recipientId, { title, message, link = '', type = 'general' }) {
  await Notification.create({ recipient: recipientId, title, message, link, type })
}

async function notifyAllAdmins({ title, message, link = '', type = 'general' }) {
  const admins = await User.find({ role: 'admin' }).select('_id')
  if (!admins.length) return
  await Notification.insertMany(
    admins.map(({ _id }) => ({
      recipient: _id,
      title,
      message,
      link,
      type,
    }))
  )
}

module.exports = { notifyUser, notifyAllAdmins }
