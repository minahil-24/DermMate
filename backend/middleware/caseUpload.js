const multer = require('multer')
const path = require('path')
const fs = require('fs')

const backendRoot = path.join(__dirname, '..')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type
    const sub =
      type === 'affected' ? 'case-affected' : type === 'followup' ? 'case-followup' : 'case-medical'
    const dir = path.join(backendRoot, 'uploads', sub)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'upload-' + unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const type = req.query.type
    if (type === 'affected' || type === 'followup') {
      if (file.mimetype.startsWith('image/')) return cb(null, true)
      const label = type === 'followup' ? 'Follow-up images' : 'Affected area images'
      return cb(new Error(`${label} must be image files`), false)
    }
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      return cb(null, true)
    }
    return cb(new Error('Only images and PDFs are allowed for medical records'), false)
  },
})

module.exports = upload
