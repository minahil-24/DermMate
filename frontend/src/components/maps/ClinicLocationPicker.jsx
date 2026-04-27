import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import axios from 'axios'
import { LocateFixed } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import '../../utils/leafletIconFix'

const LAHORE = [31.5204, 74.3587]
const DEFAULT_ZOOM = 14

function MapViewSync({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center[0], center[1], zoom, map])
  return null
}

/**
 * Embedded map for dermatologist clinic: Nominatim search (via backend proxy), draggable marker, reverse geocode.
 */
export default function ClinicLocationPicker({
  apiUrl,
  clinicAddress,
  clinicLatitude,
  clinicLongitude,
  onChange,
  disabled = false,
}) {
  const [searchQ, setSearchQ] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [locating, setLocating] = useState(false)
  const [markerPosition, setMarkerPosition] = useState(() =>
    Number.isFinite(clinicLatitude) && Number.isFinite(clinicLongitude)
      ? [clinicLatitude, clinicLongitude]
      : LAHORE
  )

  useEffect(() => {
    if (Number.isFinite(clinicLatitude) && Number.isFinite(clinicLongitude)) {
      setMarkerPosition([clinicLatitude, clinicLongitude])
    }
  }, [clinicLatitude, clinicLongitude])

  useEffect(() => {
    if (searchQ.trim().length < 2) {
      setSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/clinics/geocode/search`, {
          params: { q: searchQ.trim() },
        })
        setSuggestions(Array.isArray(res.data) ? res.data : [])
      } catch {
        setSuggestions([])
      }
    }, 500)
    return () => clearTimeout(t)
  }, [searchQ, apiUrl])

  const reverseGeocode = useCallback(
    async (lat, lng) => {
      try {
        const res = await axios.get(`${apiUrl}/api/clinics/geocode/reverse`, {
          params: { lat, lon: lng },
        })
        const name = res.data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        onChange({
          clinicAddress: name,
          clinicLatitude: lat,
          clinicLongitude: lng,
        })
      } catch {
        onChange({
          clinicAddress: clinicAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          clinicLatitude: lat,
          clinicLongitude: lng,
        })
      }
    },
    [apiUrl, onChange, clinicAddress]
  )

  const pickSuggestion = (s) => {
    const lat = s.lat
    const lng = s.lon
    setMarkerPosition([lat, lng])
    setSearchQ('')
    setSuggestions([])
    onChange({
      clinicAddress: s.display_name || '',
      clinicLatitude: lat,
      clinicLongitude: lng,
    })
  }

  const useCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setMarkerPosition([lat, lng])
        reverseGeocode(lat, lng).finally(() => setLocating(false))
      },
      () => {
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Set your exact clinic location for map search. Search is limited to Pakistan and uses OpenStreetMap (free).
      </p>

      {!disabled && (
        <div className="relative z-[500]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-xs font-semibold text-gray-700 block">Search address</label>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Locating…' : 'Use my location'}
            </button>
          </div>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Type street, area, or landmark…"
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto text-sm z-[600]">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-gray-800"
                    onClick={() => pickSuggestion(s)}
                  >
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Clinic address (saved)</label>
        <textarea
          rows={2}
          value={clinicAddress || ''}
          onChange={(e) => onChange({ clinicAddress: e.target.value })}
          disabled={disabled}
          placeholder="Filled when you pick a search result or drag the map pin"
          className="w-full p-2.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
        />
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200 h-[280px] sm:h-[360px] w-full z-0">
        <MapContainer
          center={markerPosition}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full z-0"
          scrollWheelZoom={!disabled}
          dragging={!disabled}
          doubleClickZoom={!disabled}
          touchZoom={!disabled}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewSync center={markerPosition} zoom={DEFAULT_ZOOM} />
          <Marker
            position={markerPosition}
            draggable={!disabled}
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng()
                setMarkerPosition([ll.lat, ll.lng])
                reverseGeocode(ll.lat, ll.lng)
              },
            }}
          />
        </MapContainer>
      </div>
      {!disabled && (
        <p className="text-xs text-gray-500">Drag the pin to fine-tune. Coordinates update automatically.</p>
      )}
    </div>
  )
}
