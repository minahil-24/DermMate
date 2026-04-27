import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Loader2, User, ExternalLink, Pill, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../utils/helpers'

const TreatmentPlanning = () => {
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

  /* Collect all cases that have a treatment plan set */
  const casesWithPlans = useMemo(() => {
    return cases
      .filter((c) => !c.isCancelledByPatient && c.doctorReviewStatus === 'accepted')
      .filter((c) => {
        const tp = c.treatmentPlan
        if (!tp) return false
        return !!tp.name || (tp.medications?.length > 0) || (tp.lifestyle?.length > 0) || tp.notes
      })
      .sort((a, b) => {
        const aDate = a.treatmentPlan?.updatedAt || a.updatedAt
        const bDate = b.treatmentPlan?.updatedAt || b.updatedAt
        return new Date(bDate) - new Date(aDate)
      })
  }, [cases])

  /* Cases without plans (accepted but no treatment plan yet) */
  const casesWithoutPlans = useMemo(() => {
    return cases
      .filter((c) => !c.isCancelledByPatient && c.doctorReviewStatus === 'accepted')
      .filter((c) => {
        const tp = c.treatmentPlan
        if (!tp) return true
        return !tp.name && (tp.medications?.length === 0) && (tp.lifestyle?.length === 0) && !tp.notes
      })
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
      <Breadcrumbs items={[{ label: 'Treatment Planning' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Treatment Planning</h1>
        <p className="text-gray-600">Overview of all treatment plans across your accepted cases. Open a case to edit a plan.</p>
      </div>

      {casesWithPlans.length === 0 && casesWithoutPlans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No accepted cases"
          message="Accept patient cases from the Appointments page to start creating treatment plans."
        />
      ) : (
        <div className="space-y-6">
          {/* Cases with treatment plans */}
          {casesWithPlans.map((c, idx) => {
            const tp = c.treatmentPlan || {}
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.patient?.name || 'Unknown Patient'}</p>
                        <p className="text-xs text-gray-500 capitalize">{c.complaintType} case</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/dermatologist/pcases/${c._id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Edit <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {tp.name && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Plan Name</p>
                      <p className="text-sm font-bold text-emerald-900 mt-1">{tp.name}</p>
                    </div>
                  )}

                  {/* Medications */}
                  {(tp.medications || []).length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
                        <Pill className="w-4 h-4 text-rose-500" /> Medications
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tp.medications.map((med, midx) => (
                          <div key={midx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                            <p className="text-xs text-gray-500">
                              {med.dosage}
                              {med.timesPerDay ? ` · ${med.timesPerDay} time${med.timesPerDay > 1 ? 's' : ''}/day` : ''}
                              {med.durationDays ? ` · ${med.durationDays} day${Number(med.durationDays) === 1 ? '' : 's'}` : ''}
                              {med.duration ? ` · ${med.duration}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lifestyle */}
                  {(tp.lifestyle || []).length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
                        <Heart className="w-4 h-4 text-pink-500" /> Lifestyle
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {tp.lifestyle.map((item, lidx) => (
                          <li key={lidx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes */}
                  {tp.notes && (
                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{tp.notes}</p>
                    </div>
                  )}

                  {tp.updatedAt && (
                    <p className="text-xs text-gray-400 mt-3 text-right">Updated: {formatDateTime(tp.updatedAt)}</p>
                  )}
                </Card>
              </motion.div>
            )
          })}

          {/* Cases needing plans */}
          {casesWithoutPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Cases Awaiting Treatment Plan</h2>
              <div className="space-y-2">
                {casesWithoutPlans.map((c) => (
                  <Card
                    key={c._id}
                    className="p-4 border-2 border-dashed border-gray-200 hover:border-emerald-300 cursor-pointer transition-all"
                    onClick={() => navigate(`/dermatologist/pcases/${c._id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{c.patient?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 capitalize">{c.complaintType}</p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-semibold">No plan yet</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TreatmentPlanning
