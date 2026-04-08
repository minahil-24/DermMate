/**
 * One-time: clear all dermatologist certificate records and files under uploads/certificates.
 * Usage (from backend folder): node scripts/clearDoctorCertificates.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const User = require('../models/User')
const { backendRoot } = require('../utils/uploadPaths')

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  const certDir = path.join(backendRoot, 'uploads', 'certificates')
  if (fs.existsSync(certDir)) {
    for (const name of fs.readdirSync(certDir)) {
      const full = path.join(certDir, name)
      try {
        if (fs.statSync(full).isFile()) fs.unlinkSync(full)
      } catch (e) {
        console.error('Skip file:', full, e.message)
      }
    }
  }
  const result = await User.updateMany(
    { role: 'dermatologist' },
    { $set: { certifications: [], isPendingVerification: false, isDoctorVerified: false } }
  )
  console.log('Cleared doctor certificates. Modified:', result.modifiedCount)
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
