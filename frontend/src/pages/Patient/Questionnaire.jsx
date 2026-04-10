import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { getQuestionnaireSteps } from '../../data/questionnaireSteps'
import { mergeBooking, loadBooking, redirectDraftResubmitToSchedule } from '../../utils/bookingFlow'

const Questionnaire = () => {
  const location = useLocation()
  const complaintType = location.state?.complaintType || 'hair'
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, trigger } = useForm()
  const [currentStep, setCurrentStep] = useState(1)
  const addToast = useToastStore((state) => state.addToast)

  const isBooking = location.pathname.includes('/patient/booking/')

  useEffect(() => {
    if (!isBooking) return
    redirectDraftResubmitToSchedule(navigate, location)
  }, [isBooking, navigate, location])

  const steps = getQuestionnaireSteps(complaintType)
  const totalSteps = steps.length
  const progress = (currentStep / totalSteps) * 100

  const handleNext = async () => {
    const stepFields = steps[currentStep - 1].fields.map((f) => f.name)
    const ok = await trigger(stepFields)
    if (ok && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = (data) => {
    addToast({
      type: 'success',
      title: 'Questionnaire saved',
      message: isBooking ? 'Continue with your booking.' : 'Proceeding to image upload...',
    })
    if (isBooking) {
      const doctorId = location.state?.doctorId || loadBooking().doctorId
      mergeBooking({
        questionnaire: data,
        complaintType,
        doctorId,
      })
      navigate('/patient/booking/medical-records', {
        state: {
          doctorId,
          complaintType,
          bookingFlow: true,
          doctorName: location.state?.doctorName,
        },
      })
    } else {
      navigate('/patient/upload', { state: { complaintType, questionnaireData: data } })
    }
  }

  const currentStepData = steps[currentStep - 1]

  const bookingCrumb = isBooking
    ? [{ label: 'Booking', link: '/patient/booking/complaint' }]
    : [{ label: 'New Complaint', link: '/patient/complaint' }]

  return (
    <div>
      <Breadcrumbs
        items={[...bookingCrumb, { label: 'Questionnaire' }]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Questionnaire</h1>
        <p className="text-gray-600 capitalize">
          {complaintType} — please provide detailed information
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-emerald-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-emerald-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentStepData.title}</h2>
              <div className="space-y-6">
                {currentStepData.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        {...register(field.name, { required: true })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select an option</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        {...register(field.name)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Enter details..."
                      />
                    ) : (
                      <input
                        {...register(field.name, { required: field.name === 'location' })}
                        type={field.type}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Enter details..."
                      />
                    )}
                    {errors[field.name] && (
                      <p className="text-sm text-red-600">This field is required</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit">
                Submit & Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </form>
    </div>
  )
}

export default Questionnaire
