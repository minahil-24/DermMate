import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockNotifications } from '../../mock-data/notifications'
import { formatDateTime } from '../../utils/helpers'
import EmptyState from '../../components/common/EmptyState'

const Notifications = () => {
  const navigate = useNavigate()
  const unreadNotifications = mockNotifications.filter(n => !n.read)
  const readNotifications = mockNotifications.filter(n => n.read)

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Notifications' }]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with your appointments and case updates</p>
      </div>

      {mockNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          message="You're all caught up! No new notifications."
        />
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Unread ({unreadNotifications.length})
              </h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-emerald-50 border-emerald-200">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                          <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(notification.createdAt)}
                            </span>
                            <button onClick={() => navigate(notification.link)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                              View details
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-400" />
                Read
              </h2>
              <div className="space-y-3">
                {readNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(notification.createdAt)}
                            </span>
                            <button onClick={() => navigate(notification.link)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                              View details
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications
