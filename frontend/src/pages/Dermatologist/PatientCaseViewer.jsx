import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { User, ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Card from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime } from '../../utils/helpers'

const PatientCaseViewer = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
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

  const isAppointmentDay = (appointmentDate) => {
    if (!appointmentDate) return false
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const appt = new Date(appointmentDate)
    const apptOnly = new Date(appt.getFullYear(), appt.getMonth(), appt.getDate())
    return apptOnly.getTime() === todayOnly.getTime()
  }

  const canDeclineWithin24h = (c) => {
    if (!c || c.isCancelledByPatient) return false
    if (c.doctorReviewStatus !== 'accepted') return false
    const acceptedAt = new Date(c.doctorAcceptedAt || c.updatedAt).getTime()
    if (Number.isNaN(acceptedAt)) return false
    return Date.now() - acceptedAt <= 24 * 60 * 60 * 1000
  }

  const startCase = async (e, caseId) => {
    e.stopPropagation()
    try {
      await axios.patch(
        `${apiUrl}/api/cases/${caseId}/status/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setCases((prev) => prev.map((c) => (c._id === caseId ? { ...c, caseStatus: 'started' } : c)))
      addToast({ type: 'success', title: 'Case Started', message: 'Case has been marked as started.' })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not start case',
        message: err.response?.data?.message || err.message || 'Failed to start case',
      })
    }
  }

  const declineAcceptedCase = async (e, caseId) => {
    e.stopPropagation()
    const c = cases.find((x) => x._id === caseId)
    if (!canDeclineWithin24h(c)) {
      addToast({
        type: 'error',
        title: 'Cannot decline now',
        message: 'Accepted cases can only be declined within 24 hours of acceptance.',
      })
      return
    }
    if (!window.confirm('Decline this accepted case? It will move to patient draft for resubmission.')) return
    try {
      await axios.patch(
        `${apiUrl}/api/cases/review/${caseId}`,
        { decision: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setCases((prev) => prev.filter((c) => c._id !== caseId))
      addToast({ type: 'success', title: 'Case Declined', message: 'The accepted case has been declined.' })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not decline case',
        message: err.response?.data?.message || err.message || 'Failed to decline case',
      })
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Appointments' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
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
              className={`bg-white shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${
                c.caseStatus === 'closed'
                  ? 'border-2 border-red-300'
                  : c.caseStatus === 'started'
                    ? 'border-2 border-emerald-300'
                    : ''
              }`}
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
                  <div className="flex items-center gap-2 shrink-0">
                    {c.caseStatus === 'started' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Started
                      </span>
                    ) : c.caseStatus === 'closed' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        Closed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => startCase(e, c._id)}
                        disabled={!isAppointmentDay(c.appointmentDate)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isAppointmentDay(c.appointmentDate) ? 'Case can only be started on appointment date' : ''}
                      >
                        Start Case
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => declineAcceptedCase(e, c._id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${
                        canDeclineWithin24h(c) ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300'
                      }`}
                      title={!canDeclineWithin24h(c) ? 'Decline is only allowed within 24 hours of acceptance' : ''}
                    >
                      Decline
                    </button>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientCaseViewer
