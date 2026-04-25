import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Stethoscope, Loader2, User, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../utils/helpers'

const ClinicalNotes = () => {
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

  /* Collect all clinical notes across all accepted cases */
  const allNotes = useMemo(() => {
    const notes = []
    for (const c of cases) {
      if (c.isCancelledByPatient || c.doctorReviewStatus !== 'accepted') continue
      for (const n of (c.clinicalNotes || [])) {
        notes.push({
          ...n,
          patientName: c.patient?.name || 'Unknown Patient',
          caseId: c._id,
          complaintType: c.complaintType,
        })
      }
    }
    return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [cases])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Clinical Notes' }]} />

      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 p-6 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Clinical Notes</h1>
        <p className="text-gray-700">All notes across your accepted cases. Open a case to add new notes.</p>
      </div>

      {allNotes.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No clinical notes yet"
          message="Open a patient case from the Cases page to add clinical notes."
        />
      ) : (
        <div className="space-y-3">
          {allNotes.map((n, idx) => (
            <motion.div
              key={n._id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-emerald-500">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-sm font-semibold text-emerald-800">{n.patientName}</span>
                      <span className="text-xs text-gray-400 capitalize">· {n.complaintType}</span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/dermatologist/pcases/${n.caseId}`)}
                    className="shrink-0 p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
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
  )
}

export default ClinicalNotes
