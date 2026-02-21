import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, Briefcase, Bell, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockAppointments } from '../../mock-data/appointments'
import { mockCases } from '../../mock-data/cases'
import { mockNotifications } from '../../mock-data/notifications'
import { formatDate } from '../../utils/helpers'

const PatientDashboard = () => {
  const navigate = useNavigate()
  const upcomingAppointments = mockAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
  const activeCases = mockCases.filter(c => c.status === 'active')
  const unreadNotifications = mockNotifications.filter(n => !n.read).length

  const stats = [
    {
      label: 'Active Cases',
      value: activeCases.length,
      icon: Briefcase,
      color: 'bg-emerald-500',
      change: '+2 this month',
    },
    {
      label: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'bg-blue-500',
      change: 'Next: Dec 20',
    },
    {
      label: 'Unread Notifications',
      value: unreadNotifications,
      icon: Bell,
      color: 'bg-yellow-500',
      change: '3 new today',
    },
    {
      label: 'Treatment Progress',
      value: '75%',
      icon: TrendingUp,
      color: 'bg-teal-500',
      change: '+5% this week',
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
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{stat.change}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
            <button onClick={() => navigate('/patient/appointments')} className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{apt.dermatologistName}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(apt.date)} at {apt.time}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    apt.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <p className="text-center text-gray-500 py-4">No upcoming appointments</p>
            )}
          </div>
        </Card>

        {/* Active Cases */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Cases</h2>
            <button onClick={() => navigate('/patient/cases')} className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {activeCases.slice(0, 3).map((caseItem) => (
              <div
                key={caseItem.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {caseItem.complaintType} - {caseItem.complaintSubtype}
                  </p>
                  <p className="text-sm text-gray-600">
                    Started {formatDate(caseItem.createdAt)}
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
      </div>
    </div>
  )
}

export default PatientDashboard
