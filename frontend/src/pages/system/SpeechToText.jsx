import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, FileText } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const SpeechToText = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcription, setTranscription] = useState('')

  const handleProcess = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setTranscription('Patient presents with moderate hair thinning. Treatment plan discussed.')
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Speech-to-Text Processing' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Speech-to-Text</h1>
        <p className="text-gray-600">Voice transcription processing status</p>
      </div>
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Mic className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">Processing Status</h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Audio File</span>
              <span className="text-xs text-gray-600">recording_2024-12-15.wav</span>
            </div>
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">Processing...</span>
                </>
              ) : (
                <button onClick={handleProcess} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  Process Audio
                </button>
              )}
            </div>
          </div>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">Transcription</span>
              </div>
              <p className="text-gray-900">{transcription}</p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SpeechToText
