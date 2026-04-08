import { useEffect, useMemo, useState } from 'react'
import { User, Send, ArrowLeft, Loader2, Upload, Plus } from 'lucide-react'
import { useParams, useNavigate } from "react-router-dom"
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime, formatDateTime } from '../../utils/helpers'

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

  const [medications, setMedications] = useState([])
  const [newMed, setNewMed] = useState({ name: '', dosage: '', duration: '' })
  const [lifestyle, setLifestyle] = useState('')
  const [planNotes, setPlanNotes] = useState('')

  const loadCase = async () => {
    if (!token || !caseId) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCaze(res.data)

      const tp = res.data?.treatmentPlan || {}
      setMedications(tp.medications || [])
      setLifestyle((tp.lifestyle || []).join('\n'))
      setPlanNotes(tp.notes || '')
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
    try {
      await axios.post(
        `${apiUrl}/api/cases/${caseId}/followups`,
        { date: followDate, timeSlot: followTime, reason: followReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFollowDate('')
      setFollowTime('')
      setFollowReason('Follow-up')
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const addMedication = () => {
    if (!newMed.name.trim()) return
    setMedications((prev) => [...prev, { ...newMed, name: newMed.name.trim() }])
    setNewMed({ name: '', dosage: '', duration: '' })
  }

  const saveTreatmentPlan = async () => {
    try {
      await axios.put(
        `${apiUrl}/api/cases/${caseId}/treatment-plan`,
        {
          medications,
          lifestyle: lifestyle.split('\n').map((s) => s.trim()).filter(Boolean),
          notes: planNotes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Saved', message: 'Treatment plan saved.' })
      await loadCase()
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: e.response?.data?.message || e.message })
    }
  }

  const tabs = ['Report', 'comparison', 'notes', 'plan', 'appointments', 'images']

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

            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>

            <div>
              <p className="font-semibold">{patient?.name || 'Patient'}</p>
              <p className="text-xs text-gray-500">Case #{String(caseId || '').slice(-6)}</p>
            </div>
          </div>
        </div>

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
            // Report Tab
            activeTab === 'Report' && (
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
          ))};

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
                    <div className="text-gray-900 whitespace-pre-wrap">{n.text}</div>
                  </div>
                ))}
                {(caze.clinicalNotes || []).length === 0 && <div className="text-gray-600">No notes yet.</div>}
              </div>
              <div className="p-3 border rounded-lg bg-white space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Write a new note…"
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
                {medications.map((m, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{m.name}</div>
                      <div className="text-sm text-gray-600 truncate">{m.dosage} {m.duration ? `· ${m.duration}` : ''}</div>
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
                    <input className="px-3 py-2 border rounded-lg" placeholder="Duration" value={newMed.duration} onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })} />
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

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Appointments</h2>

              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="font-semibold text-gray-900">Original appointment</p>
                <p className="text-sm text-gray-700">
                  {caze.appointmentDate ? formatDate(caze.appointmentDate) : '—'}{' '}
                  {caze.appointmentTimeSlot ? `at ${formatTime(caze.appointmentTimeSlot)}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Upcoming</p>
                  {upcomingFollowUps.map((f) => (
                    <div key={f._id} className="p-3 border rounded-lg">
                      <p className="text-sm font-semibold">{formatDate(f.date)} at {formatTime(f.timeSlot)}</p>
                      <p className="text-xs text-gray-500">{f.reason}</p>
                    </div>
                  ))}
                  {upcomingFollowUps.length === 0 && <div className="text-sm text-gray-600">No upcoming follow-ups.</div>}
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Previous</p>
                  {previousFollowUps.map((f) => (
                    <div key={f._id} className="p-3 border rounded-lg bg-gray-50">
                      <p className="text-sm font-semibold">{formatDate(f.date)} at {formatTime(f.timeSlot)}</p>
                      <p className="text-xs text-gray-500">{f.reason}</p>
                    </div>
                  ))}
                  {previousFollowUps.length === 0 && <div className="text-sm text-gray-600">No previous follow-ups.</div>}
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-white space-y-3">
                <p className="font-semibold text-gray-900">Create new appointment (follow-up)</p>
                <input type="date" value={followDate} onChange={(e) => setFollowDate(e.target.value)} className="px-3 py-2 border rounded-lg w-full" />
                <input type="time" value={followTime} onChange={(e) => setFollowTime(e.target.value)} className="px-3 py-2 border rounded-lg w-full" />
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
                    </div>
                  </div>
                ))}
                {(caze.affectedImages || []).length === 0 && <div className="text-gray-600">No images found.</div>}
              </div>
            </div>
          )}
          )

        </div>
      </div>
    </div>
  )
}

export default PatientChat;
