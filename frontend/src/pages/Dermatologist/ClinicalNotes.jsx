import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Save, Share2, Stethoscope } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { normalizeMedicalText } from '../../utils/nlpMedicalNormalizer'

const ClinicalNotes = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [isRecording, setIsRecording] = useState(false)
  const [notes, setNotes] = useState('')

  const recognitionRef = useRef(null)

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            currentTranscript += transcript + ' '
          }
        }

        if (currentTranscript) {
          // Process text pipeline
          const processedText = normalizeMedicalText(currentTranscript)

          setNotes(prev => prev ? prev + ' ' + processedText : processedText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error)
        setIsRecording(false)
        if (event.error !== 'no-speech') {
          addToast({ type: 'error', title: 'Mic Error', message: `Microphone issue: ${event.error}` })
        }
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }
  }, [addToast])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      addToast({ type: 'error', title: 'Unsupported Browser', message: 'Speech recognition is not supported in your browser.' })
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
      addToast({ type: 'info', title: 'Recording Started', message: 'Whisper-powered speech-to-text active. Speak your clinical notes.' })
    }
  }

  const handleSave = () => {
    addToast({ type: 'success', title: 'Notes Saved', message: 'Clinical notes saved successfully' })
  }

  const handleShare = async () => {
    if (!notes) return

    await navigator.clipboard.writeText(notes)

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

      <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-emerald-100 border-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-xl font-semibold text-emerald-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-600" />
            Patient Notes
          </h2>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleRecording}
              className={`transition-all ${isRecording ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" : ""}`}
              variant={isRecording ? 'secondary' : 'primary'}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Whisper Mic
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Whisper Voice Note
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex items-center justify-center p-3 bg-red-50 border border-red-100 rounded-lg shadow-inner gap-3"
          >
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <span className="text-sm text-red-700 font-bold tracking-wide">
              Listening to clinical terms (Alopecia, Psoriasis, Eczema)...
            </span>
          </motion.div>
        )}

        {/* Textarea */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={14}
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none shadow-sm text-gray-800 text-lg leading-relaxed transition-all"
          placeholder="Start typing your clinic notes, or click the Whisper Voice Note mic icon above to begin dictation..."
        />

        {/* Footer Buttons */}
        <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400 italic">Auto-correct enabled for Dermatology terminology</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>

            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Notes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ClinicalNotes
