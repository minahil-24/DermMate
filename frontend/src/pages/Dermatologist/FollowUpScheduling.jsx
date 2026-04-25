import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Loader2, User, ExternalLink, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime, formatDateTime } from '../../utils/helpers'

const FollowUpScheduling = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])

  const loadCases = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/doctor/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCases(res.data || [])
    } catch {
      setCases([])
      addToast({ type: 'error', title: 'Error', message: 'Could not load cases' })
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl, addToast])

  useEffect(() => { loadCases() }, [loadCases])

  const now = new Date()

  /* Collect all follow-ups across all accepted cases */
  const allFollowUps = useMemo(() => {
    const fups = []
    for (const c of cases) {
      if (c.isCancelledByPatient || c.doctorReviewStatus !== 'accepted') continue
      for (const f of (c.followUps || [])) {
        fups.push({
          ...f,
          patientName: c.patient?.name || 'Unknown Patient',
          caseId: c._id,
          complaintType: c.complaintType,
        })
      }
    }
    return fups
  }, [cases])

  const upcoming = useMemo(
    () => allFollowUps.filter((f) => new Date(f.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [allFollowUps]
  )

  const previous = useMemo(
    () => allFollowUps.filter((f) => new Date(f.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [allFollowUps]
  )

  /* Accepted cases (for quick scheduling links) */
  const acceptedCases = useMemo(() =>
    cases.filter((c) => !c.isCancelledByPatient && c.doctorReviewStatus === 'accepted')
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)),
    [cases]
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Follow-up Scheduling' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Follow-up Scheduling</h1>
        <p className="text-gray-600">View all scheduled follow-ups and open a case to create new ones.</p>
      </div>

      {acceptedCases.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No accepted cases"
          message="Accept patient cases from the Appointments page to schedule follow-ups."
        />
      ) : (
        <div className="space-y-8">

          {/* Quick links to schedule */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Schedule a Follow-up</h2>
            <p className="text-sm text-gray-500 mb-4">Select a patient case to schedule a new follow-up appointment:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {acceptedCases.map((c) => (
                <button
                  key={c._id}
                  onClick={() => navigate(`/dermatologist/pcases/${c._id}`)}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 bg-white hover:bg-emerald-50 transition-all text-left flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.patient?.name || 'Patient'}</p>
                    <p className="text-xs text-gray-500 capitalize truncate">{c.complaintType}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 shrink-0 ml-auto" />
                </button>
              ))}
            </div>
          </Card>

          {/* Upcoming follow-ups */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Upcoming Follow-ups
              {upcoming.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{upcoming.length}</span>
              )}
            </h2>
            {upcoming.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">No upcoming follow-ups.</Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((f, idx) => (
                  <motion.div key={f._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                    <Card className="p-4 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{formatDate(f.date)} at {formatTime(f.timeSlot)}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{f.reason || 'Follow-up'}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> {f.patientName}
                            <span className="capitalize ml-1">· {f.complaintType}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/dermatologist/pcases/${f.caseId}`)}
                          className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Open case"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Previous follow-ups */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gray-400" /> Previous Follow-ups
            </h2>
            {previous.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">No previous follow-ups.</Card>
            ) : (
              <div className="space-y-2">
                {previous.map((f, idx) => (
                  <Card key={f._id || idx} className="p-4 bg-gray-50 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{formatDate(f.date)} at {formatTime(f.timeSlot)}</p>
                        <p className="text-sm text-gray-500">{f.reason || 'Follow-up'}</p>
                        <p className="text-xs text-gray-400 mt-1">{f.patientName}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default FollowUpScheduling
