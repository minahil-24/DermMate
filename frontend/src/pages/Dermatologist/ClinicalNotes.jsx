import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Save, Share2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const ClinicalNotes = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [isRecording, setIsRecording] = useState(false)
  const [notes, setNotes] = useState('')
  const [transcription, setTranscription] = useState('')

  const handleStartRecording = () => {
    setIsRecording(true)
    addToast({ type: 'info', title: 'Recording Started', message: 'Speech-to-text is now active (mock)' })

    setTimeout(() => {
      setTranscription('Patient presents with moderate hair thinning. Treatment plan discussed. Follow-up scheduled.')
      setIsRecording(false)
    }, 3000)
  }

  const handleSave = () => {
    setNotes(transcription || notes)
    addToast({ type: 'success', title: 'Notes Saved', message: 'Clinical notes saved successfully' })
  }

  const handleShare = async () => {
    const textToShare = notes || transcription
    if (!textToShare) return

    await navigator.clipboard.writeText(textToShare)

    addToast({
      type: 'success',
      title: 'Copied!',
      message: 'Notes copied to clipboard. Ready to share!',
    })
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Clinical Notes' }]} />

      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 p-6 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Clinical Notes</h1>
        <p className="text-gray-700">Record, review, and share patient notes</p>
      </div>

      <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Patient Notes</h2>

          <div className="flex gap-2">
            <Button
              onClick={handleStartRecording}
              disabled={isRecording}
              variant={isRecording ? 'secondary' : 'primary'}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 shadow-sm"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-700 font-medium">
              Recording in progress...
            </span>
          </motion.div>
        )}

        {/* Transcription */}
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm"
          >
            <p className="text-sm text-emerald-700 font-semibold mb-2">
              Live Transcription
            </p>
            <p className="text-gray-900 leading-relaxed">{transcription}</p>
          </motion.div>
        )}

        {/* Textarea */}
        <textarea
          value={notes || transcription}
          onChange={(e) => setNotes(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none shadow-inner"
          placeholder="Type your clinical notes or use voice recording..."
        />

        {/* Footer Buttons */}
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Notes
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ClinicalNotes
