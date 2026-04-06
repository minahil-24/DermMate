const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/'
    if (file.fieldname === 'profilePhoto') dir += 'profiles/'
    if (file.fieldname === 'certifications') dir += 'certificates/'
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only images and PDFs are allowed!'), false)
    }
  }
})

module.exports = upload
