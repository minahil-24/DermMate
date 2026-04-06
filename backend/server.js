const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')

const app = express()

app.use(cors())
app.use(express.json())

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = 'uploads/'
    if (file.fieldname === 'profilePhoto') dir += 'profiles/'
    if (file.fieldname === 'certificate') dir += 'certificates/'
    
    // Ensure directory exists
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only images and PDFs are allowed!'), false)
    }
  }
})

// Attach upload to request for use in routes if needed
app.use((req, res, next) => {
  req.upload = upload
  next()
})

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    console.log(`Connected to DB: ${mongoose.connection.name}`);
  })
  .catch(err => console.error('MongoDB Connection Error:', err))

// Authentication Routes
app.use('/api/auth', authRoutes)

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'DermMate Auth Server' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Auth Server running on port ${PORT}`)
})
