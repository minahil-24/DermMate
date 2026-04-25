import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Briefcase, Bell, TrendingUp, CheckCircle, Loader2 } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatDate } from '../../utils/helpers'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const PatientDashboard = () => {
  const navigate = useNavigate()
  const { token, user, updateUser } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selectedProgressCaseId, setSelectedProgressCaseId] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const [casesRes, notifRes] = await Promise.all([
          axios.get(`${apiUrl}/api/cases/my`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const list = casesRes.data || []
        setCases(list)
        setNotifications(notifRes.data || [])

        const active = list.filter((c) => !c.isCancelledByPatient && c.doctorReviewStatus === 'accepted')
        if (active.length > 0) {
          setSelectedProgressCaseId(active[0]._id)
        }

        if (list.some((c) => c.caseStatus === 'draft')) {
          addToast({
            type: 'info',
            title: 'Send your case to a doctor?',
            message:
              'You have a draft (declined request) in My cases. Choose another dermatologist — screenings stay saved.',
            duration: 7000,
          })
        }
      } catch {
        setCases([])
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, apiUrl, addToast])

  useEffect(() => {
    if (!token || user?.role !== 'patient') return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz || (user?.timeZone && String(user.timeZone).trim())) return
    axios
      .patch(
        `${apiUrl}/api/auth/profile`,
        { timeZone: tz },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((r) => {
        if (r.data?.user) updateUser(r.data.user)
      })
      .catch(() => { })
  }, [token, user?.role, user?.timeZone, apiUrl, updateUser])

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return (cases || [])
      .filter((c) => c.caseStatus !== 'draft')
      .filter((c) => !c.isCancelledByPatient)
      .filter((c) => c.appointmentDate && new Date(c.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
  }, [cases])

  const activeCases = useMemo(() => {
    return (cases || []).filter((c) => !c.isCancelledByPatient && c.doctorReviewStatus === 'accepted')
  }, [cases])

  const treatmentProgressPct = useMemo(() => {
    if (!selectedProgressCaseId) return 0
    const c = activeCases.find((x) => x._id === selectedProgressCaseId)
    return c?.progress || 0
  }, [activeCases, selectedProgressCaseId])

  const selectedCaseName = useMemo(() => {
    const c = activeCases.find((x) => x._id === selectedProgressCaseId)
    if (!c) return 'No active treatment'
    return `${c.doctor?.name || 'Dr.'} (${c.complaintType})`
  }, [activeCases, selectedProgressCaseId])

  const stats = [
    {
      label: 'Active Cases',
      value: activeCases.length,
      icon: Briefcase,
      color: 'bg-emerald-500',
      change: activeCases.length ? 'Your current open requests' : 'No open cases',
    },
    {
      label: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'bg-blue-500',
      change: upcomingAppointments[0]?.appointmentDate ? `Next: ${formatDate(upcomingAppointments[0].appointmentDate)}` : 'No upcoming',
    },
    {
      label: 'Unread Notifications',
      value: unreadNotifications,
      icon: Bell,
      color: 'bg-yellow-500',
      change: unreadNotifications ? 'Check your inbox' : 'All caught up',
    },
    {
      label: 'Treatment Progress',
      value: `${treatmentProgressPct}%`,
      icon: TrendingUp,
      color: 'bg-teal-500',
      change: 'Starts when treatment begins',
    },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isProgress = stat.label === 'Treatment Progress'

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <div className="flex flex-col">
                        <p className={`font-bold text-gray-900 ${isProgress && treatmentProgressPct === 0 ? 'text-sm' : 'text-2xl'}`}>
                          {isProgress && treatmentProgressPct === 0 ? 'Not announced yet' : stat.value}
                        </p>
                        
                        {isProgress && treatmentProgressPct > 0 && (
                          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200/50">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${treatmentProgressPct}%` }}
                              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                            />
                          </div>
                        )}

                        {isProgress && activeCases.length > 1 && (
                          <select
                            value={selectedProgressCaseId}
                            onChange={(e) => setSelectedProgressCaseId(e.target.value)}
                            className="mt-3 text-[10px] border border-slate-200 rounded-lg bg-white/80 p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 w-full font-bold text-slate-700"
                          >
                            {activeCases.map(c => (
                              <option key={c._id} value={c._id}>
                                {c.doctor?.name || 'Doctor'} - {c.complaintType}
                              </option>
                            ))}
                          </select>
                        )}
                        {isProgress && activeCases.length === 1 && (
                          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest truncate">
                            {selectedCaseName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg shrink-0 ml-2`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">
                    {isProgress ? (activeCases.length ? 'Track your recovery' : 'No active treatments') : stat.change}
                  </p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
              <button onClick={() => navigate('/patient/appointments')} className="text-sm text-emerald-600 hover:text-emerald-700">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{apt.doctor?.name || 'Dermatologist'}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(apt.appointmentDate)} at {apt.appointmentTimeSlot || '—'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${apt.doctorReviewStatus === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : apt.doctorReviewStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {apt.isCancelledByPatient ? 'cancelled' : (apt.doctorReviewStatus || 'pending')}
                  </span>
                </div>
              ))}
              {upcomingAppointments.length === 0 && (
                <p className="text-center text-gray-500 py-4">No upcoming appointments</p>
              )}
            </div>
          </Card>

          {/* Active Cases */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Active Cases</h2>
              <button onClick={() => navigate('/patient/cases')} className="text-sm text-emerald-600 hover:text-emerald-700">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {activeCases.slice(0, 3).map((caseItem) => (
                <div
                  key={caseItem._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {caseItem.complaintType}
                    </p>
                    <p className="text-sm text-gray-600">
                      Submitted {formatDate(caseItem.createdAt)}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              ))}
              {activeCases.length === 0 && (
                <p className="text-center text-gray-500 py-4">No active cases</p>
              )}
            </div>
          </Card>

          {/* Recent Notifications */}
          <Card className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
              <button
                onClick={() => navigate('/patient/notifications')}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((n) => (
                <div
                  key={n._id}
                  className={`p-3 rounded-lg border transition-colors ${n.read ? 'bg-white border-gray-200' : 'bg-emerald-50 border-emerald-200'
                    }`}
                >
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-gray-500 py-4">No notifications</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default PatientDashboard
