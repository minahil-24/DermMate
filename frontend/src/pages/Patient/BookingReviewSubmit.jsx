import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Image as ImageIcon, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { loadBooking, clearBooking } from '../../utils/bookingFlow'
import { formatDate } from '../../utils/helpers'

const BookingReviewSubmit = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const b = useMemo(() => loadBooking(), [])
  const doctorId = b.doctorId

  const paymentLabel = (m) => {
    if (m === 'cod') return 'Cash on delivery (pending)'
    if (m === 'cash') return 'Cash at clinic (pending)'
    if (m === 'online') return 'Online (marked paid — demo)'
    return m || '—'
  }

  const paymentStatusLabel = (m) => {
    if (m === 'online') return 'Paid'
    return 'Pending COD'
  }

  const submitCase = async () => {
    if (!doctorId || !b.complaintType) {
      addToast({ type: 'error', title: 'Incomplete', message: 'Please restart booking from the doctor search.' })
      navigate('/patient/dermatologists')
      return
    }
    if (!b.affectedImages || b.affectedImages.length < 1) {
      addToast({ type: 'error', title: 'Missing images', message: 'Affected area images are required.' })
      navigate('/patient/booking/affected-images', { state: { doctorId, complaintType: b.complaintType } })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        doctorId,
        complaintType: b.complaintType,
        questionnaire: b.questionnaire || {},
        medicalHistoryFiles: b.medicalHistoryFiles || [],
        affectedImages: b.affectedImages || [],
        appointmentDate: b.appointmentDate,
        appointmentTimeSlot: b.appointmentTimeSlot,
        consultationFee: b.consultationFee ?? 0,
        paymentMethod: b.paymentMethod || 'cod',
      }
      await axios.post(`${apiUrl}/api/cases`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      clearBooking()
      addToast({
        type: 'success',
        title: 'Submitted',
        message: 'Your pre-appointment case was sent to the dermatologist.',
      })
      navigate('/patient/cases')
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Submit failed',
        message: err.response?.data?.message || err.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!doctorId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No booking data. Start from Find Specialist.</p>
        <Button className="mt-4" onClick={() => navigate('/patient/dermatologists')}>
          Go to search
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Find Specialist', link: '/patient/dermatologists' },
          { label: 'Review & submit' },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review pre-appointment submission</h1>
        <p className="text-gray-600">Confirm everything before sending to your dermatologist.</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-2">Complaint</h2>
          <p className="text-gray-700 capitalize">{b.complaintType}</p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Appointment
          </h2>
          <p className="text-gray-700">
            {b.appointmentDate ? formatDate(b.appointmentDate) : '—'} at {b.appointmentTimeSlot || '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Fee: PKR {b.consultationFee ?? 0}</p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-2">Payment</h2>
          <p className="text-gray-700">{paymentLabel(b.paymentMethod)}</p>
          <p className="text-sm text-emerald-700 font-medium mt-1">Status for your records: {paymentStatusLabel(b.paymentMethod)}</p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Questionnaire
          </h2>
          <p className="text-sm text-gray-600">
            {b.questionnaire && Object.keys(b.questionnaire).length > 0
              ? `${Object.keys(b.questionnaire).length} fields completed`
              : 'No data'}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Medical records
          </h2>
          <p className="text-sm text-gray-600">
            {(b.medicalHistoryFiles || []).length} file(s) uploaded
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Affected area ({b.complaintType})
          </h2>
          <p className="text-sm text-gray-600 mb-4">{(b.affectedImages || []).length} image(s)</p>
          <div className="flex flex-wrap gap-2">
            {(b.affectedImages || []).map((img, idx) => (
              <img
                key={`${img.filePath}-${idx}`}
                src={`${apiUrl}/${img.filePath.replace(/\\/g, '/')}`}
                alt=""
                className="w-24 h-24 object-cover rounded-lg border"
              />
            ))}
          </div>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex justify-end">
        <Button size="lg" onClick={submitCase} disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          Submit to dermatologist
        </Button>
      </motion.div>
    </div>
  )
}

export default BookingReviewSubmit
