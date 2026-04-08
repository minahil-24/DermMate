import { Bell, Moon, Sun, Menu, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const notificationsPathForRole = (role) => {
  if (role === 'patient') return '/patient/notifications'
  if (role === 'dermatologist') return '/dermatologist/notifications'
  if (role === 'admin') return '/admin/alerts'
  return '/'
}

const Navbar = ({ onMenuClick, isMobileMenuOpen }) => {
  const { darkMode, toggleDarkMode } = useThemeStore()
  const { user, token, role } = useAuthStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([])
      return
    }
    try {
      const res = await axios.get(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(res.data || [])
    } catch {
      setNotifications([])
    }
  }, [token, apiUrl])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!showNotifications) return
    loadNotifications()
  }, [showNotifications, loadNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = async (id) => {
    try {
      await axios.patch(
        `${apiUrl}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    } catch {
      /* ignore */
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="lg:hidden">
            <img src="/imgs/logo-removebg-preview.png" alt="DermMate" className="h-10 w-10" />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {darkMode ? <Sun size={20} className="text-gray-600" /> : <Moon size={20} className="text-gray-600" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[8px] h-2 px-0.5 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <Link
                      to={notificationsPathForRole(role)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      onClick={() => setShowNotifications(false)}
                    >
                      View all
                    </Link>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      notifications.slice(0, 8).map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-emerald-50' : ''
                          }`}
                          onClick={() => !notification.read && markRead(notification._id)}
                        >
                          <div className="font-medium text-sm text-gray-900">{notification.title}</div>
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</div>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-200">
                {user?.profilePhoto ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${user.profilePhoto.replace(/\\/g, '/')}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={user?.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                    alt="Placeholder"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
