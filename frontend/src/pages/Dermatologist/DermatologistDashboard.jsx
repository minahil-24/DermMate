import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Calendar, Users, Clock, TrendingUp, Loader2, Star } from 'lucide-react'
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
  const [doctorProfile, setDoctorProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const [casesRes, notifRes, profileRes] = await Promise.all([
          axios.get(`${apiUrl}/api/cases/doctor/incoming`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setCases(casesRes.data || [])
        setNotifications(notifRes.data || [])
        setDoctorProfile(profileRes.data || null)
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
    { label: 'Patient Satisfaction', value: `${doctorProfile?.averageRating || 0}/5`, icon: Star, color: 'bg-yellow-500' },
  ]

  const recentReviews = useMemo(() => {
    return (cases || [])
      .filter(c => c.review && c.review.rating)
      .sort((a, b) => new Date(b.review.createdAt) - new Date(a.review.createdAt))
      .slice(0, 5)
  }, [cases])

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
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.label === "Patient Satisfaction" && doctorProfile?.totalReviews > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          ({doctorProfile.totalReviews} reviews)
                        </span>
                      )}
                    </div>
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm">
                      {c.patient?.profilePhoto ? (
                        <img
                          src={`${apiUrl}/${c.patient.profilePhoto.replace(/\\/g, '/')}`}
                          alt={c.patient.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={c.patient?.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                          alt="Patient"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{c.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {c.complaintType?.charAt(0).toUpperCase() + c.complaintType?.slice(1)} · {c.appointmentTimeSlot ? formatTime(c.appointmentTimeSlot) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">
                      confirmed
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r) => (
                <div key={r._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < r.review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {new Date(r.review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 mb-1">{r.patient?.name}</p>
                  <p className="text-sm text-gray-600 italic">"{r.review.comment || 'No comment provided'}"</p>
                </div>
              ))}
              {recentReviews.length === 0 && (
                <div className="text-center text-gray-500 py-6">No reviews yet</div>
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
