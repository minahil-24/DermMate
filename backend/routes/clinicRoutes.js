const express = require('express')
const axios = require('axios')
const User = require('../models/User')

const router = express.Router()

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const NOMINATIM_UA = process.env.NOMINATIM_USER_AGENT || 'DermMate/1.0 (https://github.com/dermmate)'

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function nominatimHeaders() {
  return {
    'User-Agent': NOMINATIM_UA,
    Accept: 'application/json',
  }
}

/** Proxy: avoids browser CORS; supplies required User-Agent for Nominatim. */
router.get('/geocode/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (q.length < 2) {
      return res.json([])
    }
    const url = `${NOMINATIM_BASE}/search`
    const { data } = await axios.get(url, {
      params: { q, format: 'json', countrycodes: 'pk', limit: 5 },
      headers: nominatimHeaders(),
      timeout: 10000,
      validateStatus: (s) => s < 500,
    })
    if (!Array.isArray(data)) {
      return res.json([])
    }
    const out = data.map((item) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))
    res.json(out.filter((x) => !Number.isNaN(x.lat) && !Number.isNaN(x.lon)))
  } catch (e) {
    console.error('Nominatim search:', e.message)
    res.status(502).json({ message: 'Address search temporarily unavailable' })
  }
})

router.get('/geocode/reverse', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lon = parseFloat(req.query.lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ message: 'lat and lon required' })
    }
    const url = `${NOMINATIM_BASE}/reverse`
    const { data } = await axios.get(url, {
      params: { lat, lon, format: 'json' },
      headers: nominatimHeaders(),
      timeout: 10000,
      validateStatus: (s) => s < 500,
    })
    res.json({
      display_name: data?.display_name || '',
    })
  } catch (e) {
    console.error('Nominatim reverse:', e.message)
    res.status(502).json({ message: 'Reverse geocoding temporarily unavailable' })
  }
})

/**
 * Nearby dermatologist clinics (MongoDB 2dsphere — same role as PostGIS for this stack).
 * Query: lat, lng, radius (km), optional search, city, specialty, keyword, availability
 */
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)
    const radiusKm = Math.min(50, Math.max(1, parseFloat(req.query.radius) || 5))
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query parameters are required' })
    }

    const search = String(req.query.search || '').trim()
    const city = String(req.query.city || '').trim()
    const specialty = String(req.query.specialty || '').trim()
    const keyword = String(req.query.keyword || '').trim()
    const availability = String(req.query.availability || '').trim()

    const radiusM = radiusKm * 1000

    const and = [
      { role: 'dermatologist' },
      { clinicLocation: { $exists: true, $ne: null } },
    ]

    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i')
      and.push({ $or: [{ name: rx }, { clinicName: rx }] })
    }
    if (city) {
      const rx = new RegExp(escapeRegex(city), 'i')
      and.push({ $or: [{ city: rx }, { location: rx }] })
    }
    if (specialty) {
      and.push({ specialty: new RegExp(escapeRegex(specialty), 'i') })
    }
    if (keyword) {
      const rx = new RegExp(escapeRegex(keyword), 'i')
      and.push({ $or: [{ bio: rx }, { clinicName: rx }] })
    }
    if (availability) {
      and.push({ availability: new RegExp(escapeRegex(availability), 'i') })
    }

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          maxDistance: radiusM,
          spherical: true,
          query: { $and: and },
        },
      },
      { $project: { password: 0 } },
    ]

    const results = await User.aggregate(pipeline)
    const out = results.map((d) => {
      const { distanceMeters, ...rest } = d
      return {
        ...rest,
        distanceMeters,
        distanceKm: Math.round((distanceMeters / 1000) * 100) / 100,
      }
    })
    res.json(out)
  } catch (error) {
    console.error('clinics/nearby:', error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
