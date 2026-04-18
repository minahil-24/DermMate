const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const caseRoutes = require('./routes/caseRoutes')
const clinicRoutes = require('./routes/clinicRoutes')
const billingRoutes = require('./routes/billingRoutes')
const supportRoutes = require('./routes/supportRoutes')
const { syncCertificationFlags } = require('./utils/certHelpers')
const checkBlock = require('./middleware/checkBlock')

const app = express()

app.use(cors())
app.use(express.json())

// File uploads use ../middleware/upload (multer) in route handlers only.

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    console.log(`Connected to DB: ${mongoose.connection.name}`);
    await migrateLegacyCertifications();

    try {
      const User = require('./models/User')
      await User.syncIndexes()
    } catch (e) {
      console.warn('User.syncIndexes:', e.message)
    }

    const cron = require('node-cron')
    const { runTomorrowAppointmentReminders } = require('./jobs/tomorrowAppointmentReminder')
    cron.schedule('0 * * * *', () => {
      runTomorrowAppointmentReminders().catch((e) => console.error('cron appointment_tomorrow:', e))
    })
    console.log('Cron: hourly appointment-tomorrow reminders for doctors (patient/doctor timeZone).')
  })
  .catch(err => console.error('MongoDB Connection Error:', err))

async function migrateLegacyCertifications() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const coll = db.collection('users');
    const rawUsers = await coll
      .find({ role: 'dermatologist', certifications: { $exists: true, $ne: [] } })
      .toArray();
    for (const u of rawUsers) {
      const certs = u.certifications;
      if (!certs || !certs.length) continue;
      const hasStringEntry = certs.some((c) => typeof c === 'string');
      if (hasStringEntry) {
        const newCerts = certs.map((c) => {
          if (typeof c === 'string') {
            return {
              filePath: c,
              status: u.isDoctorVerified ? 'verified' : 'pending',
              uploadedAt: new Date(),
            };
          }
          return c;
        });
        await coll.updateOne({ _id: u._id }, { $set: { certifications: newCerts } });
      }
    }
    const User = require('./models/User')
    const doctors = await User.find({ role: 'dermatologist' })
    for (const u of doctors) {
      syncCertificationFlags(u)
      await u.save()
    }
    console.log('Legacy certification strings migrated to subdocuments (if any).');
  } catch (e) {
    console.error('migrateLegacyCertifications:', e);
  }
}

// Authentication Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/cases', checkBlock, caseRoutes)
app.use('/api/billing', checkBlock, billingRoutes)
app.use('/api/support', supportRoutes)

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'DermMate Auth Server' })
})

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`Auth Server running on http://${HOST}:${PORT}`)
})
