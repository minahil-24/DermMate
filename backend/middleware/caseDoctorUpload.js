const multer = require('multer')
const path = require('path')
const fs = require('fs')

const backendRoot = path.join(__dirname, '..')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(backendRoot, 'uploads', 'case-doctor')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'doctor-upload-' + unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      return cb(null, true)
    }
    return cb(new Error('Only images and PDFs are allowed'), false)
  },
})

module.exports = upload

