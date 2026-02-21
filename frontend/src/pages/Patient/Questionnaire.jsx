import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const Questionnaire = () => {
  const location = useLocation()
  const complaintType = location.state?.complaintType || 'hair'
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const [currentStep, setCurrentStep] = useState(1)
  const addToast = useToastStore((state) => state.addToast)

  const totalSteps = 4

  const steps = [
    {
      title: 'Basic Information',
      fields: [
        { name: 'duration', label: 'How long have you been experiencing this?', type: 'select', options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', 'More than 1 year'] },
        { name: 'severity', label: 'How would you rate the severity?', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
        { name: 'location', label: 'Where is the affected area?', type: 'text' },
      ],
    },
    {
      title: 'Medical History',
      fields: [
        { name: 'familyHistory', label: 'Family history of similar conditions?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
        { name: 'previousTreatment', label: 'Have you received treatment before?', type: 'select', options: ['Yes', 'No'] },
        { name: 'medications', label: 'Current medications (if any)', type: 'textarea' },
        { name: 'allergies', label: 'Known allergies', type: 'textarea' },
      ],
    },
    {
      title: 'Symptoms',
      fields: [
        { name: 'symptoms', label: 'Describe your symptoms', type: 'textarea' },
        { name: 'triggers', label: 'Any known triggers?', type: 'textarea' },
        { name: 'impact', label: 'How does this affect your daily life?', type: 'textarea' },
      ],
    },
    {
      title: 'Additional Information',
      fields: [
        { name: 'lifestyle', label: 'Lifestyle factors (diet, exercise, stress)', type: 'textarea' },
        { name: 'concerns', label: 'Any specific concerns or questions?', type: 'textarea' },
      ],
    },
  ]

  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
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
      title: 'Questionnaire Submitted',
      message: 'Your responses have been saved. Proceeding to image upload...',
    })
    navigate('/patient/upload', { state: { complaintType, questionnaireData: data } })
  }

  const currentStepData = steps[currentStep - 1]

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'New Complaint', link: '/patient/complaint' },
        { label: 'Questionnaire' },
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Questionnaire</h1>
        <p className="text-gray-600">Please provide detailed information about your condition</p>
      </div>

      {/* Progress Bar */}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentStepData.title}</h2>
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
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
                        {...register(field.name)}
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
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
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
