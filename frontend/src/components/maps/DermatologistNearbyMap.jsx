import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import '../../utils/leafletIconFix'

const LAHORE = [31.5204, 74.3587]

function FitBounds({ doctors, patientLat, patientLng }) {
  const map = useMap()
  useEffect(() => {
    const pts = [[patientLat, patientLng]]
    for (const d of doctors || []) {
      if (Number.isFinite(d.clinicLatitude) && Number.isFinite(d.clinicLongitude)) {
        pts.push([d.clinicLatitude, d.clinicLongitude])
      }
    }
    if (pts.length === 1) {
      map.setView(pts[0], 12)
      return
    }
    try {
      const b = L.latLngBounds(pts)
      map.fitBounds(b, { padding: [40, 40], maxZoom: 14 })
    } catch {
      map.setView([patientLat, patientLng], 12)
    }
  }, [map, doctors, patientLat, patientLng])
  return null
}

export default function DermatologistNearbyMap({
  apiUrl,
  patientLat,
  patientLng,
  radiusKm,
  doctors,
  draftCaseId,
}) {
  const navigate = useNavigate()

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 h-[min(70vh,520px)] min-h-[280px] w-full bg-slate-50">
      <MapContainer
        center={[patientLat, patientLng]}
        zoom={12}
        className="h-full w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[patientLat, patientLng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.06,
            weight: 2,
          }}
        />
        <Marker position={[patientLat, patientLng]} />
        <FitBounds doctors={doctors} patientLat={patientLat} patientLng={patientLng} />
        {(doctors || []).map((d) => {
          if (!Number.isFinite(d.clinicLatitude) || !Number.isFinite(d.clinicLongitude)) return null
          return (
            <Marker key={d._id} position={[d.clinicLatitude, d.clinicLongitude]}>
              <Popup className="text-sm">
                <div className="min-w-[200px]">
                  <p className="font-bold text-slate-900">{d.clinicName || 'Clinic'}</p>
                  <p className="text-slate-700">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    {d.clinicAddress || d.location || d.city || '—'}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 mt-2">
                    {d.distanceKm != null ? `${d.distanceKm} km away` : ''}
                  </p>
                  <button
                    type="button"
                    className="mt-3 w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-emerald-700"
                    onClick={() =>
                      navigate(`/patient/dermatologist/${d._id}`, {
                        state: draftCaseId ? { draftCaseId } : undefined,
                      })
                    }
                  >
                    View profile
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export { LAHORE }
