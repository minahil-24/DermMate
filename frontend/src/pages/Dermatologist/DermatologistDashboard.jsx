import { motion } from 'framer-motion'
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockAppointments } from '../../mock-data/appointments'

const DermatologistDashboard = () => {
  const todayAppointments = mockAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
  const pendingCases = 5
  const completedToday = 3

  const stats = [
    { label: 'Today\'s Appointments', value: todayAppointments.length, icon: Calendar, color: 'bg-emerald-500' },
    { label: 'Pending Cases', value: pendingCases, icon: Users, color: 'bg-blue-500' },
    { label: 'Completed Today', value: completedToday, icon: Clock, color: 'bg-teal-500' },
    { label: 'Patient Satisfaction', value: '4.8/5', icon: TrendingUp, color: 'bg-yellow-500' },
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
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Appointments</h2>
        <div className="space-y-3">
          {todayAppointments.slice(0, 5).map((apt) => (
            <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Patient Case #{apt.caseId}</p>
                <p className="text-sm text-gray-600">{apt.time}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default DermatologistDashboard
