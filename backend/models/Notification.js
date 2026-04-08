const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' },
    type: { type: String, default: 'general' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notification', notificationSchema)
