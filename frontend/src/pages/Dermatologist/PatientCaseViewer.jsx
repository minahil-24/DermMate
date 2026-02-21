import { motion } from 'framer-motion'
import { User, ArrowRight } from 'lucide-react'
import { mockAppointment } from '../../mock-data/mockAppointments'
import { useNavigate } from 'react-router-dom'

const PatientCaseViewer = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-3">
      {mockAppointment.map((apt, index) => (
        <motion.div
          key={apt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate(`/dermatologist/pcases/${apt.id}`)
} // Navigate to chat
        >
          <div className="flex items-center justify-between p-4">
            {/* Profile picture */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center">
                {apt.patient?.profilePicture ? (
                  <img
                    src={apt.patient.profilePicture}
                    alt={apt.patient?.name || 'Patient'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <p className="font-semibold text-gray-900">{apt.patient?.name || 'Unknown Patient'}</p>
            </div>

            {/* Right arrow */}
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default PatientCaseViewer
