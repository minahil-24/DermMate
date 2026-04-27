import { useEffect, useMemo, useState, useRef } from 'react'
import { User, Send, ArrowLeft, Loader2, Upload, Plus, Mic, MicOff, Calendar, Clock } from 'lucide-react'
import { useParams, useNavigate } from "react-router-dom"
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime, formatDateTime } from '../../utils/helpers'
import { normalizeMedicalText } from '../../utils/nlpMedicalNormalizer'
import AlopeciaAiDoctorPanel from '../../components/doctor/AlopeciaAiDoctorPanel'

const PatientChat = () => {
  const { id: caseId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [activeTab, setActiveTab] = useState('Report')
  const [loading, setLoading] = useState(true)
  const [caze, setCaze] = useState(null)

  const [noteText, setNoteText] = useState('')

  const [reportTitle, setReportTitle] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportFile, setReportFile] = useState(null)

  const [beforeFile, setBeforeFile] = useState(null)
  const [afterFile, setAfterFile] = useState(null)
  const [slider, setSlider] = useState(50)
  const [selectedComparison, setSelectedComparison] = useState(null)

  const [followDate, setFollowDate] = useState('')
  const [followTime, setFollowTime] = useState('')
  const [followReason, setFollowReason] = useState('Follow-up')
  const [showClosePanel, setShowClosePanel] = useState(false)
  const [closeReason, setCloseReason] = useState('treatment_completed')
  const [closeNote, setCloseNote] = useState('')
  const [editingFollowUpId, setEditingFollowUpId] = useState(null)
  const [editingFollowDate, setEditingFollowDate] = useState('')
  const [editingFollowTime, setEditingFollowTime] = useState('')
  const [editingFollowReason, setEditingFollowReason] = useState('')
  const followDateInputRef = useRef(null)
  const followTimeInputRef = useRef(null)
  const editFollowDateInputRef = useRef(null)
  const editFollowTimeInputRef = useRef(null)

  const [medications, setMedications] = useState([])
  const [planName, setPlanName] = useState('')
  const [newMed, setNewMed] = useState({ name: '', dosage: '', timesPerDay: 1, durationDays: '', duration: '' })
  const [lifestyle, setLifestyle] = useState('')
  const [planNotes, setPlanNotes] = useState('')
  const [progress, setProgress] = useState(0)

  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const recognitionActiveRef = useRef(false)
  const recognitionTransitionRef = useRef(false)
  const pendingStopRef = useRef(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onstart = () => {
        recognitionActiveRef.current = true
        recognitionTransitionRef.current = false
        setIsRecording(true)

        if (pendingStopRef.current) {
          pendingStopRef.current = false
          recognitionTransitionRef.current = true
          setIsRecording(false)
          try {
            recognitionRef.current.stop()
          } catch (e) {
            recognitionTransitionRef.current = false
          }
        }
      }
      
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
          
          setNoteText(prev => prev ? prev + ' ' + processedText : processedText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error)
        recognitionActiveRef.current = false
        recognitionTransitionRef.current = false
        pendingStopRef.current = false
        setIsRecording(false)
        if(event.error !== 'no-speech') {
          addToast({ type: 'error', title: 'Mic Error', message: `Microphone issue: ${event.error}` })
        }
      }

      recognitionRef.current.onend = () => {
        recognitionActiveRef.current = false
        recognitionTransitionRef.current = false
        pendingStopRef.current = false
        setIsRecording(false)
      }
    }
  }, [addToast])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      addToast({ type: 'error', title: 'Unsupported Browser', message: 'Speech recognition is not supported in your browser.' })
      return
    }

    // Guard rapid taps while browser speech API is transitioning.
    if (recognitionTransitionRef.current) {
      // If user taps while start is in progress, queue an immediate stop.
      if (!recognitionActiveRef.current) {
        pendingStopRef.current = true
        setIsRecording(false)
      }
      return
    }

    if (recognitionActiveRef.current) {
      recognitionTransitionRef.current = true
      pendingStopRef.current = false
      setIsRecording(false)
      try {
        recognitionRef.current.stop()
      } catch (e) {
        recognitionTransitionRef.current = false
      }
      return
    }

    pendingStopRef.current = false
    recognitionTransitionRef.current = true
    try {
      recognitionRef.current.start()
      setIsRecording(true)
      addToast({ type: 'info', title: 'Recording Started', message: 'Whisper-powered speech-to-text active. Speak your clinical notes.' })
    } catch (e) {
      recognitionTransitionRef.current = false
      if (e?.name !== 'InvalidStateError') {
        addToast({ type: 'error', title: 'Mic Error', message: e.message || 'Could not start microphone.' })
      }
    }
  }

  const loadCase = async () => {
    if (!token || !caseId) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCaze(res.data)

      const tp = res.data?.treatmentPlan || {}
      setPlanName(tp.name || '')
      setMedications(tp.medications || [])
      setLifestyle((tp.lifestyle || []).join('\n'))
      setPlanNotes(tp.notes || '')
      setProgress(res.data?.progress || 0)
      setSelectedComparison((res.data?.comparisons || [])[0] || null)
    } catch (e) {
      setCaze(null)
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || 'Could not load case' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCase()
    
  }, [caseId, token, apiUrl])

  const patient = caze?.patient

  const submitNote = async () => {
    if (!noteText.trim()) return
    try {
      await axios.post(
        `${apiUrl}/api/cases/${caseId}/notes`,
        { text: noteText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNoteText('')
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const startEditingNote = (note) => {
    setEditingNoteId(note?._id || null)
    setEditingNoteText(note?.text || '')
  }

  const cancelEditingNote = () => {
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  const updateNote = async (noteId) => {
    if (!noteId || !editingNoteText.trim()) return
    try {
      try {
        await axios.patch(
          `${apiUrl}/api/cases/${caseId}/notes/${noteId}`,
          { text: editingNoteText.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (patchError) {
        if (patchError?.response?.status !== 404) throw patchError
        await axios.post(
          `${apiUrl}/api/cases/${caseId}/notes/${noteId}/update`,
          { text: editingNoteText.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      addToast({ type: 'success', title: 'Saved', message: 'Note updated.' })
      cancelEditingNote()
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const deleteNote = async (noteId) => {
    if (!noteId) return
    if (!window.confirm('Delete this note?')) return
    try {
      try {
        await axios.delete(`${apiUrl}/api/cases/${caseId}/notes/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (deleteError) {
        if (deleteError?.response?.status !== 404) throw deleteError
        await axios.post(`${apiUrl}/api/cases/${caseId}/notes/${noteId}/delete`, null, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      addToast({ type: 'success', title: 'Deleted', message: 'Note deleted.' })
      if (editingNoteId === noteId) cancelEditingNote()
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const uploadDoctorFile = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await axios.post(`${apiUrl}/api/cases/${caseId}/doctor-upload`, fd, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data?.filePath
  }

  const submitReport = async () => {
    if (!reportTitle.trim()) return
    try {
      let filePath = ''
      if (reportFile) filePath = await uploadDoctorFile(reportFile)
      await axios.post(
        `${apiUrl}/api/cases/${caseId}/reports`,
        { title: reportTitle.trim(), description: reportDesc, filePath },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setReportTitle('')
      setReportDesc('')
      setReportFile(null)
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const submitComparison = async () => {
    if (!beforeFile || !afterFile) return
    try {
      const beforePath = await uploadDoctorFile(beforeFile)
      const afterPath = await uploadDoctorFile(afterFile)
      await axios.post(
        `${apiUrl}/api/cases/${caseId}/comparisons`,
        { beforePath, afterPath },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBeforeFile(null)
      setAfterFile(null)
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const submitFollowUp = async () => {
    if (!followDate || !followTime) return
    const selected = new Date(`${followDate}T00:00:00`)
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (selected < todayOnly) {
      addToast({ type: 'error', title: 'Invalid date', message: 'Follow-up date cannot be in the past.' })
      return
    }
    try {
      if (caze?.caseStatus === 'closed') {
        const shouldRestart = window.confirm(
          'This case is closed. Do you want to start it again before adding a follow-up?'
        )
        if (!shouldRestart) return
        await axios.patch(
          `${apiUrl}/api/cases/${caseId}/status/start`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      await axios.post(
        `${apiUrl}/api/cases/${caseId}/followups`,
        { date: followDate, timeSlot: followTime, reason: followReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFollowDate('')
      setFollowTime('')
      setFollowReason('Follow-up')
      if (caze?.caseStatus === 'closed') {
        addToast({ type: 'success', title: 'Case Restarted', message: 'Case restarted and follow-up created.' })
      }
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const toInputDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  const startEditingFollowUp = (f) => {
    setEditingFollowUpId(f?._id || null)
    setEditingFollowDate(toInputDate(f?.date))
    setEditingFollowTime(f?.timeSlot || '')
    setEditingFollowReason(f?.reason || 'Follow-up')
  }

  const cancelEditingFollowUp = () => {
    setEditingFollowUpId(null)
    setEditingFollowDate('')
    setEditingFollowTime('')
    setEditingFollowReason('')
  }

  const updateFollowUp = async (followUpId) => {
    if (!followUpId || !editingFollowDate || !editingFollowTime) return
    const selected = new Date(`${editingFollowDate}T00:00:00`)
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (selected < todayOnly) {
      addToast({ type: 'error', title: 'Invalid date', message: 'Follow-up date cannot be in the past.' })
      return
    }
    try {
      await axios.patch(
        `${apiUrl}/api/cases/${caseId}/followups/${followUpId}`,
        { date: editingFollowDate, timeSlot: editingFollowTime, reason: editingFollowReason || 'Follow-up' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Saved', message: 'Follow-up updated.' })
      cancelEditingFollowUp()
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const deleteFollowUp = async (followUpId) => {
    if (!followUpId) return
    if (!window.confirm('Delete this follow-up appointment?')) return
    try {
      await axios.delete(`${apiUrl}/api/cases/${caseId}/followups/${followUpId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (editingFollowUpId === followUpId) cancelEditingFollowUp()
      addToast({ type: 'success', title: 'Deleted', message: 'Follow-up deleted.' })
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const startCase = async () => {
    try {
      await axios.patch(
        `${apiUrl}/api/cases/${caseId}/status/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Case Started', message: 'This case is now marked as started.' })
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const closeCase = async () => {
    if (!hasAppointmentStarted) {
      addToast({ type: 'error', title: 'Cannot Close Case', message: 'Case can be closed on or after appointment date.' })
      return
    }
    if ((caze?.followUps || []).length > 0) {
      addToast({ type: 'error', title: 'Cannot Close Case', message: 'Delete follow-up appointments before closing this case.' })
      return
    }
    if (!closeReason) {
      addToast({ type: 'error', title: 'Closure reason required', message: 'Please select a reason before closing the case.' })
      return
    }
    if (closeReason === 'other' && !closeNote.trim()) {
      addToast({ type: 'error', title: 'Note required', message: 'Please add a note for "Other" reason.' })
      return
    }
    try {
      await axios.patch(
        `${apiUrl}/api/cases/${caseId}/status/close`,
        { reason: closeReason, note: closeNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Case Closed', message: 'Case has been closed for the patient.' })
      setShowClosePanel(false)
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const addMedication = () => {
    if (!newMed.name.trim()) return
    setMedications((prev) => [
      ...prev,
      {
        ...newMed,
        name: newMed.name.trim(),
        timesPerDay: Math.max(1, parseInt(newMed.timesPerDay, 10) || 1),
        durationDays: Math.max(0, parseInt(newMed.durationDays, 10) || 0),
      },
    ])
    setNewMed({ name: '', dosage: '', timesPerDay: 1, durationDays: '', duration: '' })
  }

  const saveTreatmentPlan = async () => {
    try {
      await axios.put(
        `${apiUrl}/api/cases/${caseId}/treatment-plan`,
        {
          name: planName,
          medications,
          lifestyle: lifestyle.split('\n').map((s) => s.trim()).filter(Boolean),
          notes: planNotes,
          // Progress is now managed separately
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Saved', message: 'Treatment plan saved.' })
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const saveProgress = async () => {
    try {
      await axios.patch(
        `${apiUrl}/api/cases/${caseId}/progress`,
        { progress },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Saved', message: 'Recovery progress updated.' })
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const tabs = ['Report', 'comparison', 'notes', 'progress', 'plan', 'appointments', 'images']

  const followUps = caze?.followUps || []
  const now = new Date()
  const previousFollowUps = useMemo(
    () => followUps.filter((f) => f?.date && new Date(f.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [followUps]
  )
  const upcomingFollowUps = useMemo(
    () => followUps.filter((f) => f?.date && new Date(f.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [followUps]
  )
  const minFollowUpDate = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])
  const hasAppointmentStarted = useMemo(() => {
    if (!caze?.appointmentDate) return false
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const appt = new Date(caze.appointmentDate)
    const apptOnly = new Date(appt.getFullYear(), appt.getMonth(), appt.getDate())
    return apptOnly <= todayOnly
  }, [caze?.appointmentDate])
  const isAppointmentDay = useMemo(() => {
    if (!caze?.appointmentDate) return false
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const appt = new Date(caze.appointmentDate)
    const apptOnly = new Date(appt.getFullYear(), appt.getMonth(), appt.getDate())
    return apptOnly.getTime() === todayOnly.getTime()
  }, [caze?.appointmentDate])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
              {caze?.patient?.profilePhoto ? (
                <img
                  src={`${apiUrl}/${caze.patient.profilePhoto.replace(/\\/g, '/')}`}
                  alt={caze.patient.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={caze?.patient?.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                  alt="Patient"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div>
              <p className="font-semibold">{caze?.patient?.name || 'Patient'}</p>
              <p className="text-xs text-gray-500">Case #{String(caseId || '').slice(-6)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {caze?.caseStatus !== 'started' && caze?.caseStatus !== 'closed' && (
              <button
                type="button"
                onClick={startCase}
                disabled={!isAppointmentDay}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isAppointmentDay ? 'Case can only be started on appointment date' : ''}
              >
                Start Case
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowClosePanel((v) => !v)}
              disabled={caze?.caseStatus === 'closed'}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                (caze?.followUps || []).length > 0
                  ? 'Remove follow-up appointments to close this case'
                  : !hasAppointmentStarted
                    ? 'Case can be closed on or after appointment date'
                    : ''
              }
            >
              {caze?.caseStatus === 'closed' ? 'Case Closed' : 'Close Case'}
            </button>
          </div>
        </div>
        {showClosePanel && caze?.caseStatus !== 'closed' && (
          <div className="px-4 pb-4">
            <div className="border rounded-lg bg-red-50 border-red-100 p-3 space-y-2">
              <p className="font-semibold text-red-900 text-sm">Close case reason</p>
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="treatment_completed">Treatment completed</option>
                <option value="no_show">Patient did not show up</option>
                <option value="other">Other</option>
              </select>
              {closeReason === 'other' && (
                <input
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  placeholder="Please specify reason"
                />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeCase}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowClosePanel(false)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b text-xs overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab ? "bg-emerald-600 text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          ) : !caze ? (
            <div className="text-center text-gray-600 py-10">Case not found.</div>
          ) : (
            <>
            {activeTab === 'Report' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Reports</h2>
                <div className="space-y-3">
  
                {(caze.reports || []).map((r) => (
                  <div key={r._id} className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{formatDateTime(r.createdAt)}</p>
                    <p className="text-lg font-semibold text-gray-800">{r.title}</p>
                    {r.description && <p className="text-sm text-gray-700 mt-1">{r.description}</p>}
                    {r.filePath && (
                      <a
                        className="text-sm text-emerald-700 font-semibold underline mt-2 inline-block"
                        href={`${apiUrl}/${String(r.filePath).replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open attachment
                      </a>
                    )}
                  </div>
                ))}
                {(caze.reports || []).length === 0 && <div className="text-gray-600">No reports yet.</div>}
              </div>

              <div className="p-4 border rounded-lg bg-white space-y-3">
                <p className="font-semibold text-gray-900">Add new report</p>
                <input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Report title"
                />
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Description (optional)"
                />
                <input type="file" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
                <button
                  onClick={submitReport}
                  className="w-full px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Save report
                </button>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Before / After Comparison</h2>

              {selectedComparison ? (
                <div className="relative h-80 rounded-lg overflow-hidden border">
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 relative" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                      <img
                        src={`${apiUrl}/${String(selectedComparison.beforePath).replace(/\\/g, '/')}`}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">Before</div>
                    </div>
                    <div className="flex-1 relative">
                      <img
                        src={`${apiUrl}/${String(selectedComparison.afterPath).replace(/\\/g, '/')}`}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded text-sm font-medium">After</div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slider}
                    onChange={(e) => setSlider(e.target.value)}
                    className="absolute bottom-4 left-4 right-4 w-auto"
                  />
                </div>
              ) : (
                <div className="text-gray-600">No comparisons yet.</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(caze.comparisons || []).map((cmp) => (
                  <button
                    key={cmp._id}
                    type="button"
                    onClick={() => setSelectedComparison(cmp)}
                    className={`p-3 rounded-lg border text-left ${selectedComparison?._id === cmp._id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                  >
                    <p className="font-semibold text-gray-900">Comparison</p>
                    <p className="text-xs text-gray-500">{formatDateTime(cmp.createdAt)}</p>
                  </button>
                ))}
              </div>

              <div className="p-4 border rounded-lg bg-white space-y-3">
                <p className="font-semibold text-gray-900">Upload new comparison</p>
                <div className="text-sm text-gray-600">Step 1: Upload BEFORE image</div>
                <input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] || null)} />
                <div className="text-sm text-gray-600">Step 2: Upload AFTER image</div>
                <input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] || null)} />
                <button
                  onClick={submitComparison}
                  disabled={!beforeFile || !afterFile}
                  className="w-full px-5 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Upload & save comparison
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Clinical Notes</h2>
              <div className="space-y-3">
                {(caze.clinicalNotes || []).map((n) => (
                  <div key={n._id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">{formatDateTime(n.createdAt)}</div>
                    {editingNoteId === n._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateNote(n._id)}
                            disabled={!editingNoteText.trim()}
                            className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingNote}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-900 whitespace-pre-wrap">{n.text}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingNote(n)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNote(n._id)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {(caze.clinicalNotes || []).length === 0 && <div className="text-gray-600">No notes yet.</div>}
              </div>
              <div className="p-3 border rounded-lg bg-white space-y-2">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">Add Clinical Note</p>
                    <button
                        onClick={toggleRecording}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isRecording 
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                    >
                        {isRecording ? <><MicOff className="w-4 h-4" /> Stop Whisper Mic</> : <><Mic className="w-4 h-4" /> Whisper Voice Note</>}
                    </button>
                </div>
                {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100 mb-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-xs text-red-600 font-bold">Listening to clinical terms...</span>
                    </div>
                )}
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Write a new note or click the mic to start dictation…"
                />
                <button
                  onClick={submitNote}
                  className="w-full px-5 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
                >
                  Save note
                </button>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Treatment Plan</h2>

              <div className="space-y-3">
                <div className="p-3 border rounded-lg bg-white space-y-2">
                  <div className="font-semibold text-gray-900">Treatment plan name</div>
                  <input
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. 12-Week Hair Regrowth Plan"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>
                {medications.map((m, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{m.name}</div>
                      <div className="text-sm text-gray-600 truncate">
                        {m.dosage}
                        {m.timesPerDay ? ` · ${m.timesPerDay} time${m.timesPerDay > 1 ? 's' : ''}/day` : ''}
                        {m.durationDays ? ` · ${m.durationDays} day${Number(m.durationDays) === 1 ? '' : 's'}` : ''}
                        {m.duration ? ` · ${m.duration}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMedications((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-sm font-semibold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="p-3 border rounded-lg bg-white space-y-2">
                  <div className="font-semibold text-gray-900">Add medication</div>
                  <input className="w-full px-3 py-2 border rounded-lg" placeholder="Name" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="px-3 py-2 border rounded-lg" placeholder="Dosage" value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} />
                    <input
                      type="number"
                      min="1"
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Times/day"
                      value={newMed.timesPerDay}
                      onChange={(e) => setNewMed({ ...newMed, timesPerDay: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Duration (days)"
                      value={newMed.durationDays}
                      onChange={(e) => setNewMed({ ...newMed, durationDays: e.target.value })}
                    />
                    <input className="px-3 py-2 border rounded-lg" placeholder="Extra duration note (optional)" value={newMed.duration} onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })} />
                  </div>
                  <button onClick={addMedication} className="w-full px-4 py-2 border rounded-lg font-semibold hover:bg-gray-50">
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-gray-900">Lifestyle recommendations (one per line)</label>
                <textarea value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-gray-900">Doctor notes</label>
                <textarea value={planNotes} onChange={(e) => setPlanNotes(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <button onClick={saveTreatmentPlan} className="w-full px-5 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">
                Save treatment plan
              </button>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Treatment Progress</h2>
              <div className="space-y-4 bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <label className="font-black text-emerald-900 uppercase tracking-widest text-sm">Patient Recovery Status</label>
                  <span className="text-3xl font-black text-emerald-600">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full h-3 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-xs font-bold text-emerald-700 uppercase tracking-tighter">
                  <span>Initial Diagnosis</span>
                  <span>Fully Recovered</span>
                </div>
                <p className="text-xs text-emerald-700 italic bg-white/50 p-3 rounded-lg border border-emerald-100">
                  Slide to update the patient's recovery journey. This percentage is visible on their dashboard and helps them stay motivated.
                </p>
              </div>

              <button onClick={saveProgress} className="w-full px-6 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-emerald-100 transition-all">
                Update & Notify Patient
              </button>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Appointments</h2>

              {upcomingFollowUps.length > 0 && (
                <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Next Appointment</p>
                  {editingFollowUpId === upcomingFollowUps[0]._id ? (
                    <div className="space-y-2 mt-2">
                      <input
                        type="date"
                        ref={editFollowDateInputRef}
                        min={minFollowUpDate}
                        value={editingFollowDate}
                        onChange={(e) => setEditingFollowDate(e.target.value)}
                        className="no-native-picker-icon px-3 py-2 border rounded-lg w-full bg-white text-base"
                      />
                      <input
                        type="time"
                        ref={editFollowTimeInputRef}
                        value={editingFollowTime}
                        onChange={(e) => setEditingFollowTime(e.target.value)}
                        className="no-native-picker-icon px-3 py-2 border rounded-lg w-full bg-white text-base"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            editFollowDateInputRef.current?.focus()
                            editFollowDateInputRef.current?.showPicker?.()
                          }}
                          className="px-3 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        >
                          <Calendar className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            editFollowTimeInputRef.current?.focus()
                            editFollowTimeInputRef.current?.showPicker?.()
                          }}
                          className="px-3 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                      </div>
                      <input
                        value={editingFollowReason}
                        onChange={(e) => setEditingFollowReason(e.target.value)}
                        className="px-3 py-2 border rounded-lg w-full bg-white"
                        placeholder="Reason"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateFollowUp(upcomingFollowUps[0]._id)}
                          disabled={!editingFollowDate || !editingFollowTime}
                          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingFollowUp}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-extrabold text-emerald-900 mt-1">
                        {formatDate(upcomingFollowUps[0].date)} at {formatTime(upcomingFollowUps[0].timeSlot)}
                      </p>
                      <p className="text-sm text-emerald-800 mt-1">
                        Reason: {upcomingFollowUps[0].reason || 'Follow-up'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingFollowUp(upcomingFollowUps[0])}
                          className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFollowUp(upcomingFollowUps[0]._id)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {upcomingFollowUps.length === 0 && (
                <div className="text-sm text-gray-600">No upcoming follow-ups.</div>
              )}

              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="font-semibold text-gray-900">Original appointment</p>
                <p className="text-sm text-gray-700">
                  {caze.appointmentDate ? formatDate(caze.appointmentDate) : '—'}{' '}
                  {caze.appointmentTimeSlot ? `at ${formatTime(caze.appointmentTimeSlot)}` : ''}
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-white space-y-3">
                <p className="font-semibold text-gray-900">Create new appointment (follow-up)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    ref={followDateInputRef}
                    min={minFollowUpDate}
                    value={followDate}
                    onChange={(e) => setFollowDate(e.target.value)}
                    className="no-native-picker-icon px-3 py-2 border rounded-lg w-full text-base"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      followDateInputRef.current?.focus()
                      followDateInputRef.current?.showPicker?.()
                    }}
                    className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    aria-label="Open date picker"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    ref={followTimeInputRef}
                    value={followTime}
                    onChange={(e) => setFollowTime(e.target.value)}
                    className="no-native-picker-icon px-3 py-2 border rounded-lg w-full text-base"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      followTimeInputRef.current?.focus()
                      followTimeInputRef.current?.showPicker?.()
                    }}
                    className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    aria-label="Open time picker"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                </div>
                <input value={followReason} onChange={(e) => setFollowReason(e.target.value)} className="px-3 py-2 border rounded-lg w-full" placeholder="Reason" />
                <button
                  onClick={submitFollowUp}
                  disabled={!followDate || !followTime}
                  className="w-full px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create & notify patient
                </button>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Patient Uploaded Images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(caze.affectedImages || []).map((img, idx) => (
                  <div key={`${img.filePath}-${idx}`} className="border rounded-lg overflow-hidden bg-white">
                    <img
                      src={`${apiUrl}/${String(img.filePath).replace(/\\/g, '/')}`}
                      alt={img.originalName || 'image'}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{img.originalName || 'Image'}</p>
                      <p className="text-xs text-gray-500">{img.uploadedAt ? formatDateTime(img.uploadedAt) : '—'}</p>
                      <AlopeciaAiDoctorPanel apiUrl={apiUrl} analysis={img.aiAnalysis} />
                    </div>
                  </div>
                ))}
                {(caze.affectedImages || []).length === 0 && <div className="text-gray-600">No images found.</div>}
              </div>
            </div>
          )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default PatientChat;
