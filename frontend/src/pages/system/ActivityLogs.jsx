import { motion } from 'framer-motion'
import { Activity, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatDateTime } from '../../utils/helpers'

const ActivityLogs = () => {
  const logs = [
    { id: '1', action: 'Image Upload', user: 'patient@example.com', timestamp: '2024-12-15T10:30:00Z' },
    { id: '2', action: 'AI Analysis', user: 'system', timestamp: '2024-12-15T10:35:00Z' },
    { id: '3', action: 'Appointment Booked', user: 'patient@example.com', timestamp: '2024-12-15T11:00:00Z' },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Activity Logs' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Logs</h1>
        <p className="text-gray-600">System activity and event logs</p>
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activities</h2>
        <div className="space-y-3">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Activity className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-sm text-gray-600">{log.user}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatDateTime(log.timestamp)}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ActivityLogs
