import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, User, Loader2, CreditCard, FileEdit, AlertCircle, Star } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, generateChallanPDF } from '../../utils/helpers'
import { loadBooking, mergeBooking } from '../../utils/bookingFlow'
import Modal from '../../components/ui/Modal'

const PatientCases = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedCaseForReview, setSelectedCaseForReview] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

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
    if (c.paymentMethod === 'online') return 'Pending (Online)'
    if (c.paymentMethod === 'in_clinic' || c.paymentMethod === 'cod' || c.paymentMethod === 'cash') {
      return 'Pay in clinic (pending)'
    }
    return c.paymentStatus || '—'
  }

  const statusBadge = (c) => {
    if (c.caseStatus === 'draft') {
      return { text: 'Draft', cls: 'bg-amber-50 text-amber-800 border border-amber-200' }
    }
    if (c.caseStatus === 'started') {
      return { text: 'Started', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
    }
    if (c.caseStatus === 'closed') {
      return { text: 'Closed', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
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

  const handleDeleteDraft = async (caseId) => {
    if (!caseId) return
    if (!window.confirm('Delete this draft case permanently?')) return
    try {
      await axios.delete(`${apiUrl}/api/cases/draft/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const booking = loadBooking()
      if (booking?.draftCaseId === caseId) {
        mergeBooking({ draftCaseId: null, complaintType: null })
      }
      setCases((prev) => prev.filter((c) => c._id !== caseId))
      addToast({ type: 'success', title: 'Draft Deleted', message: 'The draft case has been removed.' })
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: e.response?.data?.message || e.message || 'Could not delete draft case',
      })
    }
  }

  const handleOpenReview = (c) => {
    setSelectedCaseForReview(c)
    setRating(0)
    setComment('')
    setReviewModalOpen(true)
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      addToast({ type: 'error', title: 'Rating Required', message: 'Please select a rating' })
      return
    }
    try {
      setSubmittingReview(true)
      await axios.post(`${apiUrl}/api/cases/${selectedCaseForReview._id}/review`, 
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Review Submitted', message: 'Thank you for your feedback!' })
      setReviewModalOpen(false)
      // Refresh cases to update UI (hide button)
      const res = await axios.get(`${apiUrl}/api/cases/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCases(res.data || [])
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: e.response?.data?.message || 'Could not submit review',
      })
    } finally {
      setSubmittingReview(false)
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
                  {caseItem.caseStatus === 'closed' && caseItem.closure?.reason && (
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Closure reason</p>
                      <p className="mt-1">
                        {caseItem.closure.reason === 'no_show'
                          ? 'Patient did not show up'
                          : caseItem.closure.reason === 'treatment_completed'
                            ? 'Treatment completed'
                            : 'Other'}
                        {caseItem.closure.note ? `: ${caseItem.closure.note}` : ''}
                      </p>
                    </div>
                  )}

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
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
                        onClick={() =>
                          navigate('/patient/dermatologists', { state: { draftCaseId: caseItem._id } })
                        }
                      >
                        <FileEdit className="w-4 h-4" />
                        Send to another doctor
                      </Button>
                      <Button
                        variant="danger"
                        className="w-full rounded-xl font-bold gap-2"
                        onClick={() => handleDeleteDraft(caseItem._id)}
                      >
                        Delete Draft
                      </Button>
                    </div>
                  )}
                  {needsPayment(caseItem) && (
                    <Button
                      className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                      onClick={() => handlePay(caseItem)}
                    >
                      {caseItem.paymentMethod === 'online' ? 'Pay now (Stripe)' : 'Download Challan'}
                    </Button>
                  )}

                  {caseItem.caseStatus === 'closed' && !caseItem.review?.rating && (
                    <Button
                      className="w-full mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                      onClick={() => handleOpenReview(caseItem)}
                    >
                      <Star className="w-4 h-4" />
                      Give Review
                    </Button>
                  )}

                  {caseItem.review?.rating && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < caseItem.review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="font-medium italic">Reviewed</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Rate your Experience"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-4">How was your consultation with Dr. {selectedCaseForReview?.doctor?.name}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`p-2 rounded-lg transition-all ${
                    rating >= s ? 'text-amber-500 scale-110' : 'text-slate-300 hover:text-amber-300'
                  }`}
                >
                  <Star size={32} fill={rating >= s ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="Tell others about your experience..."
              rows={4}
            />
          </div>

          <Button
            className="w-full h-12 rounded-xl text-lg font-bold"
            onClick={handleSubmitReview}
            disabled={submittingReview}
          >
            {submittingReview ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : 'Submit Feedback'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default PatientCases
