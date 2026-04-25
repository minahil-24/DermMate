const express = require('express')
const User = require('../models/User')
const MedicalCase = require('../models/Case')
const auth = require('../middleware/auth')

const router = express.Router()

/**
 * GET /api/admin/analytics
 * Returns aggregate data for charts
 */
router.get('/analytics', auth(['admin']), async (req, res) => {
  try {
    // 1. User Distribution
    const patientCount = await User.countDocuments({ role: 'patient' })
    const doctorCount = await User.countDocuments({ role: 'dermatologist' })
    const adminCount = await User.countDocuments({ role: 'admin' })

    // 2. Appointments over time (Last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const appointments = await MedicalCase.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          caseStatus: { $ne: 'draft' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const barData = appointments.map(a => ({
      label: `${monthNames[a._id.month - 1]}`,
      count: a.count
    }))

    res.json({
      userDistribution: {
        patients: patientCount,
        doctors: doctorCount,
        admins: adminCount
      },
      appointmentsOverTime: barData
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
