import { motion } from 'framer-motion'
import { Bell, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockNotifications } from '../../mock-data/notifications'
import { formatDateTime } from '../../utils/helpers'
import EmptyState from '../../components/common/EmptyState'

const DermatologistNotifications = () => {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Notifications' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with appointments and case updates</p>
      </div>
      {mockNotifications.length === 0 ? (
        <EmptyState icon={Bell} title="No Notifications" message="You're all caught up!" />
      ) : (
        <div className="space-y-4">
          {mockNotifications.map((notification, index) => (
            <motion.div key={notification.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className={!notification.read ? 'bg-emerald-50 border-emerald-200' : ''}>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DermatologistNotifications
