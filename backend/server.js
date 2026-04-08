const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const caseRoutes = require('./routes/caseRoutes')
const { syncCertificationFlags } = require('./utils/certHelpers')

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
      if (typeof certs[0] === 'string') {
        const newCerts = certs.map((filePath) => ({
          filePath,
          status: u.isDoctorVerified ? 'verified' : 'pending',
          uploadedAt: new Date(),
        }));
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
app.use('/api/notifications', notificationRoutes)
app.use('/api/cases', caseRoutes)

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'DermMate Auth Server' })
})

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`Auth Server running on http://${HOST}:${PORT}`)
})
