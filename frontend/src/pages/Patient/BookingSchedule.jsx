import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Clock, Banknote, CreditCard, Loader2 } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatTime, isSlotBooked } from '../../utils/helpers'
import { mergeBooking, loadBooking } from '../../utils/bookingFlow'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { fetchCanBookDoctor } from '../../utils/canBookDoctor'

function toLocalYmd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const BookingSchedule = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('in_clinic')
  const [bookedSlots, setBookedSlots] = useState([])

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const draftCaseId = location.state?.draftCaseId || loadBooking().draftCaseId
  const doctorId = location.state?.doctorId || loadBooking().doctorId
  const complaintType = location.state?.complaintType || loadBooking().complaintType

  useEffect(() => {
    if (doctorId && !draftCaseId && !complaintType) {
      navigate('/patient/booking/complaint', { replace: true, state: { doctorId } })
    }
  }, [doctorId, draftCaseId, complaintType, navigate])

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

  useEffect(() => {
    if (!draftCaseId || !token) return
    const syncDraft = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/cases/${draftCaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        mergeBooking({
          draftCaseId,
          complaintType: res.data.complaintType,
        })
      } catch {
        /* ignore */
      }
    }
    syncDraft()
  }, [draftCaseId, token, apiUrl])

  useEffect(() => {
    if (!doctorId || !token) return
    const run = async () => {
      try {
        const data = await fetchCanBookDoctor(apiUrl, token, doctorId, draftCaseId || undefined)
        if (data && data.allowed === false) {
          addToast({
            type: 'error',
            title: 'Cannot book',
            message: data.message || 'You cannot book with this dermatologist right now.',
          })
          navigate('/patient/dermatologists', { replace: true })
        }
      } catch {
        /* ignore */
      }
    }
    run()
  }, [doctorId, token, draftCaseId, apiUrl, navigate, addToast])

  useEffect(() => {
    if (!doctorId || !token) return
    const loadBooked = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/cases/doctor/${doctorId}/booked-slots?days=60`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBookedSlots(Array.isArray(res.data?.booked) ? res.data.booked : [])
      } catch {
        setBookedSlots([])
      }
    }
    loadBooked()
  }, [doctorId, token, apiUrl])

  useEffect(() => {
    if (!selectedDate || !selectedTime) return
    if (isSlotBooked(bookedSlots, selectedDate, selectedTime)) {
      setSelectedTime(null)
    }
  }, [bookedSlots, selectedDate, selectedTime])

  const availableDates = useMemo(() => {
    const base = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i + 1)
      return date
    })
    const wd = doctor?.availabilityWeekdays
    if (!Array.isArray(wd) || wd.length === 0) return base
    const set = new Set(wd.map((n) => Number(n)))
    return base.filter((d) => set.has(d.getDay()))
  }, [doctor])

  useEffect(() => {
    if (!selectedDate) return
    const ok = availableDates.some((d) => toLocalYmd(d) === selectedDate)
    if (!ok) setSelectedDate(null)
  }, [availableDates, selectedDate])

  const fee = doctor?.consultationFee || 0
  const availableSlots = useMemo(() => {
    const s = doctor?.availabilitySlots
    if (Array.isArray(s) && s.length) return s
    return []
  }, [doctor])

  const goReview = () => {
    if (!selectedDate || !selectedTime) return
    const ct = complaintType || loadBooking().complaintType
    mergeBooking({
      appointmentDate: selectedDate,
      appointmentTimeSlot: selectedTime,
      paymentMethod,
      consultationFee: fee,
      draftCaseId: draftCaseId || undefined,
      complaintType: ct,
    })
    navigate('/patient/booking/review', {
      state: {
        doctorId,
        complaintType: ct,
        bookingFlow: true,
        draftCaseId: draftCaseId || undefined,
      },
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
        <p className="text-gray-600">
          {draftCaseId
            ? 'Resubmitting your saved draft — pick a new slot and payment. Questionnaire and images are reused.'
            : 'Choose a slot and how you will pay (online payments coming soon).'}
        </p>
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
            {availableDates.length === 0 ? (
              <p className="text-sm text-gray-600 col-span-7">
                No bookable days in the next 30 days match this specialist&apos;s working days. Try again later or contact
                the clinic.
              </p>
            ) : (
              availableDates.slice(0, 14).map((date) => {
              const dateStr = toLocalYmd(date)
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
            })
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Time
          </h3>
          {availableSlots.length === 0 ? (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
              This dermatologist has not set availability slots yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {availableSlots.map((time) => {
                const taken = Boolean(selectedDate && isSlotBooked(bookedSlots, selectedDate, time))
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => !taken && setSelectedTime(time)}
                    disabled={!selectedDate || taken}
                    title={taken ? 'This slot is already booked' : undefined}
                    className={`p-3 rounded-lg text-center text-sm ${
                      !selectedDate || taken
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedTime === time
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {formatTime(time)}
                    {taken ? <span className="block text-[10px] font-normal mt-0.5">Booked</span> : null}
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <button
            type="button"
            onClick={() => setPaymentMethod('in_clinic')}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 text-left ${
              paymentMethod === 'in_clinic' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
            }`}
          >
            <Banknote className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="font-bold text-gray-900">Pay in clinic</p>
              <p className="text-xs text-gray-500">Pay at the clinic on the day of your visit</p>
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
          disabled={
            !selectedDate ||
            !selectedTime ||
            (selectedDate && selectedTime && isSlotBooked(bookedSlots, selectedDate, selectedTime)) ||
            availableSlots.length === 0 ||
            availableDates.length === 0
          }
        >
          Review & submit
        </Button>
      </div>
    </div>
  )
}

export default BookingSchedule
