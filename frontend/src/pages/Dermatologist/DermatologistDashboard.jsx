import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Calendar, Users, Clock, TrendingUp, Loader2 } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatTime } from '../../utils/helpers'

const DermatologistDashboard = () => {
  const { token } = useAuthStore()
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const [casesRes, notifRes] = await Promise.all([
          axios.get(`${apiUrl}/api/cases/doctor/incoming`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setCases(casesRes.data || [])
        setNotifications(notifRes.data || [])
      } catch {
        setCases([])
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, apiUrl])

  const isSameDay = (d1, d2) => {
    const a = new Date(d1)
    const b = new Date(d2)
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  const todayAppointments = useMemo(() => {
    const now = new Date()
    return (cases || [])
      .filter((c) => !c.isCancelledByPatient)
      .filter((c) => c.doctorReviewStatus === 'accepted') // appointments that will actually happen
      .filter((c) => c.appointmentDate && isSameDay(c.appointmentDate, now))
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
  }, [cases])

  const appointmentRequests = useMemo(() => {
    return (cases || []).filter(
      (c) => !c.isCancelledByPatient && (c.doctorReviewStatus === 'pending' || !c.doctorReviewStatus)
    ).length
  }, [cases])

  // Active cases: accepted and not cancelled. Since there's no "closed" status yet, treat future+today as active.
  const activeCases = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return (cases || []).filter(
      (c) =>
        !c.isCancelledByPatient &&
        c.doctorReviewStatus === 'accepted' &&
        c.appointmentDate &&
        new Date(c.appointmentDate) >= startOfToday
    ).length
  }, [cases])

  const stats = [
    { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: 'bg-emerald-500' },
    { label: 'Appointment Requests', value: appointmentRequests, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Cases', value: activeCases, icon: Clock, color: 'bg-teal-500' },
    { label: 'Patient Satisfaction', value: '0/5', icon: TrendingUp, color: 'bg-yellow-500' },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, Doctor!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Appointments</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 10).map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{c.patient?.name || 'Patient'}</p>
                    <p className="text-sm text-gray-600">
                      {c.patient?.email || '—'} · {c.complaintType || '—'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {c.appointmentDate ? formatDate(c.appointmentDate) : '—'}{' '}
                      {c.appointmentTimeSlot ? `at ${formatTime(c.appointmentTimeSlot)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      accepted
                    </span>
                  </div>
                </div>
              ))}
              {todayAppointments.length === 0 && (
                <div className="text-center text-gray-500 py-6">No appointments scheduled for today</div>
              )}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 8).map((n) => (
                <div
                  key={n._id}
                  className={`p-3 rounded-lg border ${n.read ? 'bg-white border-gray-200' : 'bg-emerald-50 border-emerald-200'}`}
                >
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center text-gray-500 py-6">No notifications</div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default DermatologistDashboard
