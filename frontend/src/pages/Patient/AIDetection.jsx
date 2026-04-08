import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useToastStore } from '../../store/toastStore'

const AIDetection = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState(null)

  useEffect(() => {
    // Simulate AI processing
    const timer = setTimeout(() => {
      setResults({
        detected: true,
        condition: 'Androgenetic Alopecia',
        confidence: 87,
        severity: 'Moderate',
        description: 'The AI analysis indicates signs of androgenetic alopecia with moderate progression. Early intervention is recommended.',
        recommendations: [
          'Consult with a dermatologist for personalized treatment',
          'Consider topical treatments like Minoxidil',
          'Maintain a healthy diet and lifestyle',
        ],
      })
      setLoading(false)
      addToast({
        type: 'success',
        title: 'Analysis Complete',
        message: 'AI analysis has been completed successfully',
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [])


const handleContinue = () => {
  // Get the dermatologist name from location state (if passed)
  const dermatologistName = location.state?.dermatologistName || 'the dermatologist';

  // Show toast notification
  addToast({
    type: 'success',
    title: 'Appointment Submitted',
    message: `Your appointment request has been submitted to ${dermatologistName}.`,
  });

  // Navigate to Dermatologists page after 1 second
  setTimeout(() => {
    navigate('/patient/dermatologists');
  }, 1000);
}

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'New Complaint', link: '/patient/complaint' },
        { label: 'AI Detection' },
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Analysis</h1>
        <p className="text-gray-600">Analyzing your images with AI-powered detection</p>
      </div>

      {loading ? (
        <Card>
          <div className="py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Images</h3>
              <p className="text-gray-600 mb-4">Our AI is analyzing your images...</p>
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span className="text-sm text-gray-600">Running detection algorithms</span>
              </div>
            </div>
          </div>
        </Card>
      ) : results ? (
        <div className="space-y-6">
          {/* Results Card */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                <p className="text-sm text-gray-600">AI-powered detection completed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="text-sm text-emerald-600 mb-1">Condition Detected</div>
                <div className="text-lg font-semibold text-gray-900">{results.condition}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Confidence Level</div>
                <div className="text-lg font-semibold text-gray-900">{results.confidence}%</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600 mb-1">Severity</div>
                <div className="text-lg font-semibold text-gray-900">{results.severity}</div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{results.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Important Notice</h4>
                <p className="text-sm text-yellow-800">
                  This AI analysis is for informational purposes only and should not replace professional medical diagnosis. 
                  Please consult with a qualified dermatologist for proper evaluation and treatment.
                </p>
              </div>
            </div>
          </div>

         <div className="flex justify-end">
  <Button onClick={handleContinue} size="lg">
    Submit to Dermatologist
  </Button>
</div>

        </div>
      ) : null}
    </div>
  )
}

export default AIDetection
