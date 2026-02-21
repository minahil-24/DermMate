import { motion } from 'framer-motion'
import { Clock, CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const ReminderAutomation = () => {
  const reminders = [
    { id: '1', type: 'Appointment', recipient: 'patient@example.com', scheduledFor: '2024-12-20 09:00', status: 'sent' },
    { id: '2', type: 'Follow-up', recipient: 'patient@example.com', scheduledFor: '2024-12-22 14:00', status: 'pending' },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Reminder Automation' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reminder Automation</h1>
        <p className="text-gray-600">Automated reminder system logs</p>
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Reminders</h2>
        <div className="space-y-3">
          {reminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">{reminder.type}</p>
                  <p className="text-sm text-gray-600">{reminder.recipient}</p>
                  <p className="text-xs text-gray-500">{reminder.scheduledFor}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                reminder.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {reminder.status}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ReminderAutomation
