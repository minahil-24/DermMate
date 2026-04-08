import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { User, ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatTime } from '../../utils/helpers'

const PatientCaseViewer = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const res = await axios.get(`${apiUrl}/api/cases/doctor/incoming`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCases(res.data || [])
      } catch {
        setCases([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, apiUrl])

  const acceptedCases = useMemo(() => {
    return (cases || [])
      .filter((c) => !c.isCancelledByPatient)
      .filter((c) => c.doctorReviewStatus === 'accepted')
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
  }, [cases])

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Cases' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accepted Appointments</h1>
        <p className="text-gray-600">Only patients whose appointment request you accepted appear here.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
      ) : acceptedCases.length === 0 ? (
        <Card className="p-8 text-center text-gray-600">No accepted appointments yet.</Card>
      ) : (
        <div className="space-y-3">
          {acceptedCases.map((c, index) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/dermatologist/pcases/${c._id}`)}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                    {c.patient?.profilePhoto ? (
                      <img
                        src={`${apiUrl}/${String(c.patient.profilePhoto).replace(/\\/g, '/')}`}
                        alt={c.patient?.name || 'Patient'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.patient?.name || 'Unknown Patient'}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {c.complaintType} · {c.appointmentDate ? formatDate(c.appointmentDate) : '—'}
                      {c.appointmentTimeSlot ? ` · ${formatTime(c.appointmentTimeSlot)}` : ''}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientCaseViewer
