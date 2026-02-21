import { useState, useEffect } from 'react'
import { Brain, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const AIInference = () => {
  const [status, setStatus] = useState('processing')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setStatus('completed')
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <Breadcrumbs items={[{ label: 'AI Inference' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Inference Status</h1>
        <p className="text-gray-600">Real-time AI model processing status</p>
      </div>
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === 'processing' ? (
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            ) : (
              <Brain className="w-8 h-8 text-emerald-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {status === 'processing' ? 'Processing...' : 'Inference Complete'}
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progress}% complete</p>
        </div>
      </Card>
    </div>
  )
}

export default AIInference
