import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, User, CheckCircle, XCircle, Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockAppointments } from '../../mock-data/appointments'
import { formatDate, formatTime } from '../../utils/helpers'
import EmptyState from '../../components/common/EmptyState'

const mockPatient = {
  id: 'p1',
  name: 'Ali Khan',
  email: 'alikhan@gmail.com',
}

const PatientAppointments = () => {
  const navigate = useNavigate()
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Appointments' }]} />
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-600">Manage your scheduled appointments</p>
        </div>
        <Button
          onClick={() => navigate('/patient/appointment-booking')}
          className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
        >
          Book New Appointment
        </Button>
      </div>

      {mockAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Appointments"
          message="You don't have any appointments scheduled yet."
          action={
            <Button
              onClick={() => navigate('/patient/appointment-booking')}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Book Appointment
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {mockAppointments.map((apt, index) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{apt.dermatologistName}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(apt.date)} at {formatTime(apt.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="capitalize">{apt.type}</span>
                        </div>
                      </div>
                      {apt.notes && (
                        <p className="text-sm text-gray-600 mt-2">{apt.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                      {getStatusIcon(apt.status)}
                      {apt.status}
                      {apt.status === 'confirmed' && <Download className="w-4 h-4 ml-1" />}
                    </span>

                    {apt.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-red-50 text-red-600 border-red-400"
                        >
                          Cancel
                        </Button>

                        {/* Attractive Pay Now Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            navigate('/patient/payment', {
                              state: {
                                appointment: apt,
                                patient: mockPatient,
                              },
                            })
                          }
                          className="mt-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
                        >
                          Pay Now
                        </motion.button>
                      </>
                    )}
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

export default PatientAppointments
