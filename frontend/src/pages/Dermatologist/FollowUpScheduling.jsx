import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime } from '../../utils/helpers'

const mockPreviousAppointments = [
  { id: 1, date: '2026-01-10', time: '10:30', reason: 'Routine Check-up' },
  { id: 2, date: '2025-12-28', time: '14:00', reason: 'Follow-up on Lab Results' },
  { id: 3, date: '2025-12-15', time: '09:00', reason: 'Blood Pressure Monitoring' },
]

const FollowUpScheduling = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [reminder, setReminder] = useState(true)

  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      addToast({
        type: 'success',
        title: 'Follow-up Scheduled',
        message: `Follow-up scheduled for ${formatDate(selectedDate)} at ${formatTime(selectedTime)}`,
      })
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Follow-up Scheduling' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Follow-up</h1>
        <p className="text-gray-600">Schedule follow-up appointments for patients</p>
      </div>

      {/* Previous Appointments */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Previous Appointments</h2>
        <div className="space-y-2">
          {mockPreviousAppointments.map((apt) => (
            <div key={apt.id} className="flex justify-between p-2 border rounded-lg bg-gray-50">
              <div>
                <p className="text-sm font-medium">{apt.reason}</p>
                <p className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="text-sm text-gray-700">{apt.time}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Schedule Follow-up */}
      <Card>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label className="text-sm text-gray-700">Send reminder notification to patient</label>
          </div>
          {selectedDate && selectedTime && (
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm font-medium text-emerald-900 mb-1">Follow-up Preview</p>
              <p className="text-sm text-emerald-700">
                Date: {formatDate(selectedDate)} at {formatTime(selectedTime)}
              </p>
              {reminder && (
                <p className="text-xs text-emerald-600 mt-2">Reminder will be sent 24 hours before appointment</p>
              )}
            </div>
          )}
          <Button onClick={handleSchedule} disabled={!selectedDate || !selectedTime} className="w-full">
            Schedule Follow-up
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default FollowUpScheduling
