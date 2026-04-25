import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, User, Loader2, CreditCard, FileEdit, AlertCircle } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, generateChallanPDF } from '../../utils/helpers'

const PatientCases = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${apiUrl}/api/cases/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCases(res.data || [])
      } catch {
        setCases([])
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token, apiUrl])

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

  const payLabel = (c) => {
    if (c.paymentStatus === 'paid') return 'Paid'
    if (c.paymentMethod === 'in_clinic' || c.paymentMethod === 'cod' || c.paymentMethod === 'cash') {
      return 'Pay in clinic (pending)'
    }
    return c.paymentStatus || '—'
  }

  const statusBadge = (c) => {
    if (c.caseStatus === 'draft') {
      return { text: 'Draft', cls: 'bg-amber-50 text-amber-800 border border-amber-200' }
    }
    return { text: 'Submitted', cls: 'bg-emerald-50 text-emerald-600' }
  }

  const needsPayment = (c) =>
    !c.isCancelledByPatient &&
    c.paymentStatus !== 'paid' &&
    c.doctorReviewStatus === 'accepted';

  const handlePay = async (c) => {
    try {
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
      }
    } catch (e) {
      console.error(e)
      addToast({
        type: 'error',
        title: 'Payment Error',
        message: e.response?.data?.message || e.message || 'Payment initiation failed',
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-slate-900 font-sans">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'My Cases' }]} />

      <div className="mt-8 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Cases</h1>
          <p className="text-slate-500 mt-1">Pre-appointment submissions, drafts, and consultation history.</p>
        </div>
        <Button onClick={() => navigate('/patient/dermatologists')} variant="outline">
          Book with a specialist
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
      ) : cases.length === 0 ? (
        <Card className="text-center py-16 rounded-[2rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-600 mb-4">No cases yet. Complete a booking flow to see your case here.</p>
          <Button onClick={() => navigate('/patient/dermatologists')}>Find a dermatologist</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {cases.map((caseItem, index) => {
            const st = statusBadge(caseItem)
            const isDraft = caseItem.caseStatus === 'draft'
            return (
              <motion.div
                key={caseItem._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`group relative bg-white border rounded-[2rem] p-8 transition-all duration-300 hover:shadow-2xl ${
                    isDraft
                      ? 'border-amber-200 ring-1 ring-amber-100 hover:border-amber-300'
                      : 'border-slate-200 hover:border-emerald-500/30 hover:shadow-emerald-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                      {caseItem._id?.slice(-8)}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
                      {st.text}
                    </span>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {cap(caseItem.complaintType)}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {isDraft ? 'Declined — resend to another doctor anytime' : 'Pre-appointment package'}
                    </p>
                  </div>

                  {isDraft && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-100 text-sm text-slate-700">
                      <p className="flex items-start gap-2 font-semibold text-amber-900">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        Declined by {caseItem.doctor?.name || 'your dermatologist'}
                      </p>
                      {caseItem.doctorRejectionComment ? (
                        <p className="mt-2 text-slate-600 pl-6 border-l-2 border-amber-200">
                          {caseItem.doctorRejectionComment}
                        </p>
                      ) : (
                        <p className="mt-2 text-slate-500 pl-6">No comment from the doctor.</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 shrink-0 shadow-sm">
                        {caseItem.doctor?.profilePhoto ? (
                          <img
                            src={`${apiUrl}/${caseItem.doctor.profilePhoto.replace(/\\/g, '/')}`}
                            alt={caseItem.doctor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={caseItem.doctor?.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                            alt="Doctor"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                          {isDraft ? 'Previously assigned' : 'Dermatologist'}
                        </p>
                        <p className="text-sm font-semibold text-slate-700">{caseItem.doctor?.name || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <Calendar size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                          Requested visit
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {caseItem.appointmentDate ? formatDate(caseItem.appointmentDate) : '—'} ·{' '}
                          {caseItem.appointmentTimeSlot || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <CreditCard size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Payment</p>
                        <p className="text-sm font-semibold text-slate-700">{payLabel(caseItem)}</p>
                      </div>
                    </div>
                  </div>

                  {isDraft && (
                    <Button
                      className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
                      onClick={() =>
                        navigate('/patient/dermatologists', { state: { draftCaseId: caseItem._id } })
                      }
                    >
                      <FileEdit className="w-4 h-4" />
                      Send to another doctor
                    </Button>
                  )}
                  {needsPayment(caseItem) && (
                    <Button
                      className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                      onClick={() => handlePay(caseItem)}
                    >
                      {caseItem.paymentMethod === 'online' ? 'Pay now (Stripe)' : 'Download Challan'}
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PatientCases
