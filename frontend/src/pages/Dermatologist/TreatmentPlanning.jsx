import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Mic, MicOff, Plus, X, Stethoscope } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { normalizeMedicalText } from '../../utils/nlpMedicalNormalizer'

const TreatmentPlanning = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [medications, setMedications] = useState([
    { name: 'Minoxidil 5%', dosage: 'Apply twice daily', duration: '6 months' },
  ])
  const [newMed, setNewMed] = useState({ name: '', dosage: '', duration: '' })
  const [lifestyle, setLifestyle] = useState(['Reduce stress', 'Balanced diet'])
  const [notes, setNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  
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
        if(event.error !== 'no-speech') {
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

  const handleAddMedication = () => {
    if (newMed.name && newMed.dosage) {
      setMedications([...medications, newMed])
      setNewMed({ name: '', dosage: '', duration: '' })
      addToast({ type: 'success', title: 'Medication Added', message: 'New medication added to treatment plan' })
    }
  }

  const handleSave = () => {
    addToast({ type: 'success', title: 'Treatment Plan Saved', message: 'Treatment plan has been saved successfully' })
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Treatment Planning' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Treatment Planning</h1>
        <p className="text-gray-600">Create and manage patient treatment plans</p>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            Treatment Plan
          </h2>
        </div>
        <div className="space-y-6">
          
          {/* Clinical Notes with Speech to text */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600"/>
                Clinical Notes
              </h3>
              <Button 
                variant={isRecording ? "secondary" : "outline"} 
                size="sm" 
                onClick={toggleRecording}
                className={isRecording ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : ""}
              >
                {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isRecording ? 'Stop Recording' : 'Voice Input (Whisper)'}
              </Button>
            </div>
            {isRecording && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <p className="text-xs text-red-600 font-medium">Listening to medical terminology...</p>
              </motion.div>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-y shadow-inner text-gray-800"
              placeholder="Type your notes or click 'Voice Input' to use speech-to-text..."
            />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Medications</h3>
            <div className="space-y-3">
              {medications.map((med, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{med.name}</p>
                    <p className="text-sm text-gray-600">{med.dosage} - {med.duration}</p>
                  </div>
                  <button onClick={() => setMedications(medications.filter((_, i) => i !== index))}>
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Medication name"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={newMed.duration}
                    onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <Button onClick={handleAddMedication} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Lifestyle Recommendations</h3>
            <textarea
              value={lifestyle.join('\n')}
              onChange={(e) => setLifestyle(e.target.value.split('\n'))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter lifestyle recommendations..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg">
              Save Treatment Plan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TreatmentPlanning
