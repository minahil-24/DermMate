import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Ban,
  Stethoscope,
} from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatDate, formatTime, generateChallanPDF } from '../../utils/helpers'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const PatientAppointments = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCases(res.data || [])
    } catch {
      setCases([])
      addToast({ type: 'error', title: 'Error', message: 'Could not load appointments' })
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl, addToast])

  useEffect(() => {
    load()
  }, [load])

  const reviewLabel = (c) => {
    if (c.isCancelledByPatient) return { text: 'Cancelled', cls: 'bg-slate-100 text-slate-600' }
    const r = c.doctorReviewStatus || 'pending'
    if (r === 'pending') return { text: 'Awaiting doctor', cls: 'bg-amber-100 text-amber-800' }
    if (r === 'accepted') return { text: 'Accepted', cls: 'bg-emerald-100 text-emerald-800' }
    if (r === 'rejected') return { text: 'Declined', cls: 'bg-red-100 text-red-800' }
    return { text: r, cls: 'bg-gray-100 text-gray-700' }
  }

  const needsPayment = (c) =>
    !c.isCancelledByPatient &&
    c.paymentStatus !== 'paid' &&
    c.doctorReviewStatus === 'accepted'

  const canCancel = (c) =>
    !c.isCancelledByPatient && (c.doctorReviewStatus === 'pending' || !c.doctorReviewStatus)

  const handlePay = async (c) => {
    try {
      setActionId(c._id)
      if (c.paymentMethod === 'online') {
        const res = await axios.post(`${apiUrl}/api/billing/stripe/create-patient-session`, { caseId: c._id }, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.url) window.location.href = res.data.url;
      } else {
        generateChallanPDF({ 
          patient: c.patient, 
          doctor: c.doctor, 
          paymentMethod: c.paymentMethod, 
          fee: c.consultationFee, 
          date: c.appointmentDate, 
          timeSlot: c.appointmentTimeSlot 
        });
        addToast({ type: 'success', title: 'Challan Downloaded', message: 'Bring this challan to the clinic.' });
      }
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message,
      })
    } finally {
      setActionId(null)
    }
  }

  const handleCancel = async (c) => {
    if (!window.confirm('Cancel this booking request? The doctor will be notified.')) return
    try {
      setActionId(c._id)
      await axios.patch(
        `${apiUrl}/api/cases/${c._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Cancelled', message: 'Your case request was cancelled.' })
      await load()
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message,
      })
    } finally {
      setActionId(null)
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Appointments' }]} />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments & cases</h1>
          <p className="text-gray-600">
            Pre-appointment cases, visit schedule, payment, and doctor decisions.
          </p>
        </div>
        <Button
          onClick={() => navigate('/patient/dermatologists')}
          className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
        >
          Book new
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No cases yet"
          message="Submit a booking with a dermatologist to see it here."
          action={
            <Button
              onClick={() => navigate('/patient/dermatologists')}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Find a dermatologist
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {cases
            .filter((c) => c.caseStatus !== 'draft')
            .map((c, index) => {
            const st = reviewLabel(c)
            const doc = c.doctor
            return (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {doc?.name || 'Dermatologist'}
                        </h3>
                        <p className="text-sm text-emerald-700 font-medium capitalize mb-2">
                          {c.complaintType} · {doc?.specialty || 'Dermatology'}
                        </p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>
                              {c.appointmentDate ? formatDate(c.appointmentDate) : '—'} at{' '}
                              {c.appointmentTimeSlot ? formatTime(c.appointmentTimeSlot) : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 shrink-0" />
                            <span>Fee: PKR {c.consultationFee ?? 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 shrink-0" />
                            <span>
                              Payment:{' '}
                              {c.paymentStatus === 'paid'
                                ? 'Paid'
                                : c.paymentMethod === 'online'
                                  ? 'Pending (online)'
                                  : 'Pending (pay in clinic)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 w-fit ${st.cls}`}
                      >
                        {st.text === 'Accepted' && <CheckCircle className="w-3.5 h-3.5" />}
                        {st.text === 'Declined' && <XCircle className="w-3.5 h-3.5" />}
                        {st.text === 'Cancelled' && <Ban className="w-3.5 h-3.5" />}
                        {st.text === 'Awaiting doctor' && <Clock className="w-3.5 h-3.5" />}
                        {st.text}
                      </span>

                      <div className="flex flex-wrap gap-2 justify-end">
                        {canCancel(c) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionId === c._id}
                            className="hover:bg-red-50 text-red-600 border-red-200"
                            onClick={() => handleCancel(c)}
                          >
                            Cancel request
                          </Button>
                        )}
                        {needsPayment(c) && !c.isCancelledByPatient && (
                          <Button
                            size="sm"
                            disabled={actionId === c._id}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handlePay(c)}
                          >
                            {c.paymentMethod === 'online' ? 'Pay now (Stripe)' : 'Download Challan'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/patient/cases')}
                        >
                          Full case
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PatientAppointments
