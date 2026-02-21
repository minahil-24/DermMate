import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockDermatologists } from '../../mock-data/dermatologists'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime } from '../../utils/helpers'

const AppointmentBooking = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const dermatologistId = location.state?.dermatologistId || '1'
  const dermatologist = mockDermatologists.find(d => d.id === dermatologistId) || mockDermatologists[0]
  
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Generate available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date
  })

  const handleConfirm = () => {
    addToast({
      type: 'success',
      title: 'Appointment Booked',
      message: `Your appointment with ${dermatologist.name} has been confirmed`,
    })
    setShowConfirmModal(false)
    navigate('/patient/appointments')
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Find Dermatologist', link: '/patient/dermatologists' },
        { label: 'Book Appointment' },
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
        <p className="text-gray-600">Schedule your consultation with {dermatologist.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dermatologist Info */}
        <Card>
          <div className="text-center mb-4">
            <img
              src={dermatologist.avatar}
              alt={dermatologist.name}
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{dermatologist.name}</h3>
            <p className="text-gray-600 mb-2">{dermatologist.specialization}</p>
            <div className="flex items-center justify-center gap-1 mb-4">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{dermatologist.rating}</span>
              <span className="text-gray-600">({dermatologist.totalReviews} reviews)</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>{dermatologist.location.address}</p>
              <p>{dermatologist.location.city}, {dermatologist.location.state}</p>
            </div>
          </div>
        </Card>

        {/* Date Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {availableDates.slice(0, 14).map((date) => {
              const dateStr = date.toISOString().split('T')[0]
              const isSelected = selectedDate === dateStr
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNum = date.getDate()
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 rounded-lg text-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="text-xs mb-1">{dayName}</div>
                  <div className="font-semibold">{dayNum}</div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Time Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Select Time
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {dermatologist.availableSlots.map((time) => {
              const isSelected = selectedTime === time
              return (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  disabled={!selectedDate}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    !selectedDate
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {formatTime(time)}
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Summary & Confirm */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Appointment Summary</h3>
                <div className="space-y-1 text-gray-600">
                  <p>Date: {formatDate(selectedDate)}</p>
                  <p>Time: {formatTime(selectedTime)}</p>
                  <p>Doctor: {dermatologist.name}</p>
                </div>
              </div>
              <Button onClick={() => setShowConfirmModal(true)}>
                Confirm Booking
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Appointment"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-600">You are about to book an appointment with</p>
            <p className="font-semibold text-gray-900">{dermatologist.name}</p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2 text-left">
              <p><span className="font-medium">Date:</span> {formatDate(selectedDate)}</p>
              <p><span className="font-medium">Time:</span> {formatTime(selectedTime)}</p>
              <p><span className="font-medium">Location:</span> {dermatologist.location.address}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AppointmentBooking
