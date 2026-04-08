import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Clock, Banknote, CreditCard, Loader2 } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatTime } from '../../utils/helpers'
import { mergeBooking, loadBooking } from '../../utils/bookingFlow'

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
]

const BookingSchedule = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const doctorId = location.state?.doctorId || loadBooking().doctorId
  const complaintType = location.state?.complaintType || loadBooking().complaintType

  useEffect(() => {
    if (!doctorId) {
      navigate('/patient/dermatologists', { replace: true })
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${apiUrl}/api/auth/users/${doctorId}`)
        setDoctor(res.data)
      } catch {
        setDoctor(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [doctorId, apiUrl, navigate])

  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date
  })

  const fee = doctor?.consultationFee || 0

  const goReview = () => {
    if (!selectedDate || !selectedTime) return
    mergeBooking({
      appointmentDate: selectedDate,
      appointmentTimeSlot: selectedTime,
      paymentMethod,
      consultationFee: fee,
    })
    navigate('/patient/booking/review', {
      state: { doctorId, complaintType, bookingFlow: true },
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Could not load doctor. Please start again.</p>
        <Button className="mt-4" onClick={() => navigate('/patient/dermatologists')}>
          Back to search
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Find Specialist', link: '/patient/dermatologists' },
          { label: 'Schedule & payment' },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule & payment</h1>
        <p className="text-gray-600">Choose a slot and how you will pay (online payments coming soon).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="text-center mb-4">
            <img
              src={
                doctor.profilePhoto
                  ? `${apiUrl}/${doctor.profilePhoto.replace(/\\/g, '/')}`
                  : doctor.gender === 'female'
                    ? '/imgs/default-female.png'
                    : '/imgs/default-male.png'
              }
              alt={doctor.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
            <p className="text-gray-600 text-sm">{doctor.specialty || 'Dermatologist'}</p>
            <p className="text-emerald-700 font-bold mt-2">PKR {fee}</p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Date
          </h3>
          <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto">
            {availableDates.slice(0, 14).map((date) => {
              const dateStr = date.toISOString().split('T')[0]
              const isSelected = selectedDate === dateStr
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNum = date.getDate()
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 rounded-lg text-center transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="text-xs mb-1">{dayName}</div>
                  <div className="font-semibold">{dayNum}</div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Time
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                disabled={!selectedDate}
                className={`p-3 rounded-lg text-center text-sm ${
                  !selectedDate
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : selectedTime === time
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('cod')}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 text-left ${
              paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
            }`}
          >
            <Banknote className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-bold text-gray-900">Cash on delivery</p>
              <p className="text-xs text-gray-500">Pay when you receive the visit confirmation</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 text-left ${
              paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
            }`}
          >
            <Banknote className="w-8 h-8 text-slate-600" />
            <div>
              <p className="font-bold text-gray-900">Cash at clinic</p>
              <p className="text-xs text-gray-500">Pay at the clinic on the day of visit</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('online')}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 text-left ${
              paymentMethod === 'online' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
            }`}
          >
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-bold text-gray-900">Online (demo)</p>
              <p className="text-xs text-gray-500">Marked as paid for testing; gateway later</p>
            </div>
          </button>
        </div>
      </Card>

      <div className="flex justify-end mt-8">
        <Button
          size="lg"
          onClick={goReview}
          disabled={!selectedDate || !selectedTime}
        >
          Review & submit
        </Button>
      </div>
    </div>
  )
}

export default BookingSchedule
