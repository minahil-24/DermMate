import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Breadcrumbs from './Breadcrumbs'
import { formatDateTime } from '../../utils/helpers'
import EmptyState from './EmptyState'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const NotificationInboxPage = ({ breadcrumbItems, subtitle }) => {
  const { token } = useAuthStore()
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems(res.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = async (id) => {
    try {
      await axios.patch(
        `${apiUrl}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    } catch {
      /* ignore */
    }
  }

  const markAllRead = async () => {
    try {
      await axios.post(
        `${apiUrl}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        {items.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No Notifications" message="You're all caught up!" />
      ) : (
        <div className="space-y-4">
          {items.map((notification, index) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`${!notification.read ? 'bg-emerald-50 border-emerald-200' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <Link
                          to={notification.link}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                          onClick={() => !notification.read && markRead(notification._id)}
                        >
                          Open
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => markRead(notification._id)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Mark read
                        </button>
                      )}
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

export default NotificationInboxPage
