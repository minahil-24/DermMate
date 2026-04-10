import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Calendar,
  Clock,
  Ban,
  Stethoscope,
  ImageIcon,
  FileText,
} from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatDate, formatTime } from '../../utils/helpers'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import EmptyState from '../../components/common/EmptyState'

function fileUrl(apiUrl, filePath) {
  if (!filePath) return ''
  return `${apiUrl}/${String(filePath).replace(/\\/g, '/')}`
}

/** API / lean docs may expose _id as string or { $oid } */
function caseIdFrom(doc) {
  if (!doc) return ''
  const id = doc._id ?? doc.id
  if (typeof id === 'string') return id
  if (id && typeof id === 'object' && id.$oid) return String(id.$oid)
  try {
    return id != null ? String(id) : ''
  } catch {
    return ''
  }
}

function formatQuestionnaire(q) {
  if (!q || typeof q !== 'object') return null
  return Object.entries(q).map(([key, val]) => (
    <div key={key} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
      <span className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
      <span className="text-gray-600">
        {val !== null && typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
      </span>
    </div>
  ))
}

const DermatologistAppointments = () => {
  const addToast = useToastStore((state) => state.addToast)
  const { token } = useAuthStore()
  const [selectedCase, setSelectedCase] = useState(null)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [declineNote, setDeclineNote] = useState('')

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/doctor/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = res.data || []
      list.sort((a, b) => {
        const pa = (a.doctorReviewStatus || 'pending') === 'pending' && !a.isCancelledByPatient ? 0 : 1
        const pb = (b.doctorReviewStatus || 'pending') === 'pending' && !b.isCancelledByPatient ? 0 : 1
        if (pa !== pb) return pa - pb
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })
      setCases(list)
    } catch {
      setCases([])
      addToast({ type: 'error', title: 'Error', message: 'Could not load appointment requests' })
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl, addToast])

  useEffect(() => {
    load()
  }, [load])

  const statusBadge = (c) => {
    if (c.isCancelledByPatient) {
      return { text: 'Cancelled by patient', cls: 'bg-slate-100 text-slate-600' }
    }
    const r = c.doctorReviewStatus || 'pending'
    if (r === 'pending') return { text: 'Awaiting your decision', cls: 'bg-amber-100 text-amber-800' }
    if (r === 'accepted') return { text: 'Accepted', cls: 'bg-emerald-100 text-emerald-800' }
    if (r === 'rejected') return { text: 'Declined', cls: 'bg-red-100 text-red-800' }
    return { text: r, cls: 'bg-gray-100 text-gray-700' }
  }

  const canDecide = (c) =>
    !c.isCancelledByPatient && (c.doctorReviewStatus === 'pending' || !c.doctorReviewStatus)

  const handleReview = async (decision) => {
    const cid = caseIdFrom(selectedCase)
    if (!cid) return
    try {
      setActionLoading(true)
      const body =
        decision === 'rejected'
          ? { decision, comment: declineNote.trim().slice(0, 1000) }
          : { decision }
      await axios.patch(`${apiUrl}/api/cases/review/${cid}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      })
      addToast({
        type: 'success',
        title: decision === 'accepted' ? 'Case accepted' : 'Case declined',
        message: 'The patient has been notified.',
      })
      setDeclineNote('')
      setSelectedCase(null)
      await load()
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message,
      })
    } finally {
      setActionLoading(false)
    }
  }

  const patientAvatar = (p) => {
    if (p?.profilePhoto) return fileUrl(apiUrl, p.profilePhoto)
    return null
  }

  const questionnaireNodes = selectedCase ? formatQuestionnaire(selectedCase.questionnaire) : null

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Appointment Requests' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-appointment cases</h1>
        <p className="text-gray-600">
          Review submitted questionnaires, images, and schedule. Accept or decline each request; the patient is
          notified automatically.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No cases yet"
          message="When a patient completes booking with you, their case will appear here."
        />
      ) : (
        <div className="space-y-4">
          {cases.map((c, index) => {
            const st = statusBadge(c)
            const p = c.patient
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-emerald-100 shrink-0">
                        {patientAvatar(p) ? (
                          <img src={patientAvatar(p)} alt={p?.name || 'Patient'} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{p?.name || 'Patient'}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {c.complaintType} ·{' '}
                          {c.appointmentDate ? formatDate(c.appointmentDate) : '—'} at{' '}
                          {c.appointmentTimeSlot ? formatTime(c.appointmentTimeSlot) : '—'}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}
                        >
                          {st.text === 'Accepted' && <CheckCircle className="w-3 h-3" />}
                          {st.text === 'Declined' && <XCircle className="w-3 h-3" />}
                          {st.text === 'Cancelled by patient' && <Ban className="w-3 h-3" />}
                          {st.text === 'Awaiting your decision' && <Clock className="w-3 h-3" />}
                          {st.text}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md transition-colors duration-200 shrink-0"
                      onClick={() => setSelectedCase(c)}
                    >
                      <Eye className="w-4 h-4" />
                      View case
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 relative my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-600 shadow-md shrink-0">
                {patientAvatar(selectedCase.patient) ? (
                  <img
                    src={patientAvatar(selectedCase.patient)}
                    alt={selectedCase.patient?.name || 'Patient'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-emerald-600 m-auto" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCase.patient?.name || 'Patient'}
                </h2>
                <p className="text-sm text-gray-500">{selectedCase.patient?.email || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-gray-700 text-sm">
              <div>
                <strong>Age:</strong> {selectedCase.patient?.age ?? '—'}
              </div>
              <div>
                <strong>Gender:</strong> {selectedCase.patient?.gender ?? '—'}
              </div>
              <div>
                <strong>Phone:</strong> {selectedCase.patient?.phoneNumber ?? '—'}
              </div>
              <div className="sm:col-span-2">
                <strong>Location:</strong> {selectedCase.patient?.location ?? '—'}
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-2">
                <Calendar className="w-4 h-4" />
                Requested visit
              </div>
              <p className="text-sm text-gray-700">
                {selectedCase.appointmentDate ? formatDate(selectedCase.appointmentDate) : '—'} at{' '}
                {selectedCase.appointmentTimeSlot ? formatTime(selectedCase.appointmentTimeSlot) : '—'}
              </p>
              <p className="text-sm mt-1">
                <strong>Complaint:</strong> <span className="capitalize">{selectedCase.complaintType}</span> ·{' '}
                <strong>Fee:</strong> PKR {selectedCase.consultationFee ?? 0} ·{' '}
                <strong>Payment:</strong>{' '}
                {selectedCase.paymentStatus === 'paid' || selectedCase.paymentMethod === 'online'
                  ? 'Paid'
                  : 'Pending (pay in clinic)'}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Questionnaire
              </h3>
              <div className="rounded-lg border border-gray-200 p-3 bg-white max-h-48 overflow-y-auto">
                {questionnaireNodes?.length ? questionnaireNodes : <p className="text-sm text-gray-500">No questionnaire data.</p>}
              </div>
            </div>

            {selectedCase.medicalHistoryFiles?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Medical records ({selectedCase.medicalHistoryFiles.length})
                </h3>
                <ul className="space-y-2">
                  {selectedCase.medicalHistoryFiles.map((f, i) => (
                    <li key={i}>
                      <a
                        href={fileUrl(apiUrl, f.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline text-sm"
                      >
                        {f.originalName || `File ${i + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCase.affectedImages?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Affected area images ({selectedCase.affectedImages.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.affectedImages.map((img, i) => (
                    <a
                      key={i}
                      href={fileUrl(apiUrl, img.filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={fileUrl(apiUrl, img.filePath)}
                        alt={img.originalName || `Image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {canDecide(selectedCase) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional note to patient (if you decline)
                </label>
                <textarea
                  value={declineNote}
                  onChange={(e) => setDeclineNote(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Reason for declining — shown to the patient in My cases and their notification."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              {canDecide(selectedCase) && (
                <>
                  <Button
                    disabled={actionLoading}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md"
                    onClick={() => handleReview('accepted')}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accept
                  </Button>
                  <Button
                    disabled={actionLoading}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md"
                    onClick={() => handleReview('rejected')}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Decline
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="border-gray-300 hover:border-gray-400 text-gray-700"
                onClick={() => {
                  setDeclineNote('')
                  setSelectedCase(null)
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default DermatologistAppointments
