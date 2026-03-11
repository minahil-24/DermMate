const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const dermatologistRoutes = require('./routes/dermatologist.routes')
const path = require('path')

const app = express()

app.use(cors())
app.use(express.json())

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    console.log(`Connected to DB: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
  })
  .catch(err => console.log(err))

app.use('/api/auth', authRoutes)
app.use('/api/dermatologists', dermatologistRoutes)

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
