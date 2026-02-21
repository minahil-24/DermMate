import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, CheckCircle, XCircle, Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockAppointment } from '../../mock-data/mockAppointments'
import { format } from 'date-fns'
import { useToastStore } from '../../store/toastStore'

const DermatologistAppointments = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [selectedCase, setSelectedCase] = useState(null)
  const [appointments, setAppointments] = useState(mockAppointment)

  const handleAccept = (id) => {
    addToast({
      type: 'success',
      title: 'Appointment Accepted',
      message: 'You have accepted the appointment request.',
    })
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: 'confirmed' } : apt))
    )
    setSelectedCase(null)
  }

  const handleReject = (id) => {
    addToast({
      type: 'info',
      title: 'Appointment Rejected',
      message: 'You have rejected the appointment request.',
    })
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: 'rejected' } : apt))
    )
    setSelectedCase(null)
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Appointment Requests' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Appointment Requests</h1>
        <p className="text-gray-600">Click "View Case" to see patient details and accept/reject requests</p>
      </div>

      <div className="space-y-4">
        {appointments.map((apt, index) => (
          <motion.div
            key={apt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Patient Profile Picture */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-emerald-100">
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
                  <div>
                    <p className="font-semibold text-gray-900">{apt.patient?.name || 'Unknown Patient'}</p>
                    <p className="text-sm text-gray-600">
                      {apt.requestDate ? format(new Date(apt.requestDate), 'PPpp') : 'Unknown Date'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md transition-colors duration-200"
                  onClick={() => setSelectedCase(apt)}
                >
                  <Eye className="w-4 h-4" />
                  View Case
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal for Case Details */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 relative"
          >
            {/* Patient Profile Picture */}
<div className="flex items-center gap-4 mb-4">
  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-600 shadow-md">
    {selectedCase.patient?.profilePicture ? (
      <img
        src={selectedCase.patient.profilePicture}
        alt={selectedCase.patient?.name || 'Patient'}
        className="w-full h-full object-cover"
      />
    ) : (
      <User className="w-10 h-10 text-emerald-600 m-auto" />
    )}
  </div>
  <h2 className="text-2xl font-bold text-gray-900">{selectedCase.patient?.name || 'Unknown Patient'}</h2>
</div>


            <div className="grid grid-cols-2 gap-4 mb-4 text-gray-700">
              <div><strong>Age:</strong> {selectedCase.patient?.age || '-'}</div>
              <div><strong>Phone:</strong> {selectedCase.patient?.phone || '-'}</div>
              <div><strong>Email:</strong> {selectedCase.patient?.email || '-'}</div>
              <div><strong>Address:</strong> {selectedCase.patient?.address || '-'}</div>
            </div>

            <div className="mb-4 text-gray-700">
              <p><strong>Problem:</strong> {selectedCase.problem || '-'}</p>
              <p><strong>Symptoms:</strong> {selectedCase.symptoms?.join(', ') || '-'}</p>
              <p><strong>Questions:</strong> {selectedCase.questions?.join('; ') || '-'}</p>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              {selectedCase.status === 'pending' && (
                <>
                  <Button
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md transition-colors duration-200"
                    onClick={() => handleAccept(selectedCase.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </Button>
                  <Button
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md transition-colors duration-200"
                    onClick={() => handleReject(selectedCase.id)}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
                onClick={() => setSelectedCase(null)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default DermatologistAppointments
