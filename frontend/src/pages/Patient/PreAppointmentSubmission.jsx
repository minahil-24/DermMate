import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Image, CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const PreAppointmentSubmission = () => {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    setSubmitted(true)
    addToast({
      type: 'success',
      title: 'Case Submitted',
      message: 'Your case has been submitted to the dermatologist',
    })
    setTimeout(() => {
      navigate('/patient/appointments')
    }, 2000)
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Pre-Appointment Submission' }]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Case</h1>
        <p className="text-gray-600">Review and submit your case information before the appointment</p>
      </div>

      {!submitted ? (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">Questionnaire Summary</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">6 months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <span className="font-medium">Moderate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Family History:</span>
                <span className="font-medium">Yes</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Image className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">Uploaded Images</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Analysis Results</h2>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Condition: <span className="font-medium">Androgenetic Alopecia</span></p>
              <p className="text-sm text-gray-600">Confidence: <span className="font-medium">87%</span></p>
              <p className="text-sm text-gray-600">Severity: <span className="font-medium">Moderate</span></p>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} size="lg">
              Submit Case
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Case Submitted Successfully!</h2>
            <p className="text-gray-600">Your dermatologist will review your case before the appointment.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default PreAppointmentSubmission
