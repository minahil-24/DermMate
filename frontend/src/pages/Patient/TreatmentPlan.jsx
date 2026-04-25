import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, FileText, Clock, Image as ImageIcon, ClipboardList,
  Pill, Loader2, ArrowLeft, Download, Stethoscope, Heart, ChevronRight
} from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime, formatDateTime } from '../../utils/helpers'

const tabs = ['Reports', 'Notes', 'Appointments', 'Comparisons', 'Treatment Plan']

const TreatmentDashboard = () => {
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [selectedCase, setSelectedCase] = useState(null)
  const [activeTab, setActiveTab] = useState('Reports')

  const loadCases = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCases(res.data || [])
    } catch {
      setCases([])
      addToast({ type: 'error', title: 'Error', message: 'Could not load your cases' })
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl, addToast])

  useEffect(() => { loadCases() }, [loadCases])

  /* Only show accepted cases (where dermatologist is actively working) */
  const activeCases = useMemo(() =>
    (cases || []).filter(
      (c) =>
        !c.isCancelledByPatient &&
        c.doctorReviewStatus === 'accepted'
    ).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    [cases]
  )

  const loadFullCase = async (caseItem) => {
    try {
      const res = await axios.get(`${apiUrl}/api/cases/${caseItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedCase(res.data)
      setActiveTab('Reports')
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Could not load case details' })
    }
  }

  const now = new Date()

  const followUps = selectedCase?.followUps || []
  const upcomingFollowUps = useMemo(
    () => followUps.filter((f) => f?.date && new Date(f.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [followUps]
  )
  const previousFollowUps = useMemo(
    () => followUps.filter((f) => f?.date && new Date(f.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [followUps]
  )

  const tp = selectedCase?.treatmentPlan || {}

  const [slider, setSlider] = useState(50)
  const [selectedComparison, setSelectedComparison] = useState(null)

  useEffect(() => {
    if (selectedCase?.comparisons?.length) {
      setSelectedComparison(selectedCase.comparisons[0])
    } else {
      setSelectedComparison(null)
    }
  }, [selectedCase])

  const getIcon = (type) => {
    switch (type) {
      case 'Reports': return <FileText className="w-5 h-5 text-emerald-500" />
      case 'Notes': return <ClipboardList className="w-5 h-5 text-yellow-500" />
      case 'Appointments': return <Calendar className="w-5 h-5 text-blue-500" />
      case 'Comparisons': return <ImageIcon className="w-5 h-5 text-purple-500" />
      case 'Treatment Plan': return <Pill className="w-5 h-5 text-rose-500" />
      default: return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-[#FDFDFD] text-slate-900">
      <Breadcrumbs items={selectedCase ? [{ label: 'Treatments', onClick: () => setSelectedCase(null) }, { label: selectedCase.doctor?.name || 'Case' }] : [{ label: 'Treatments' }]} />

      {!selectedCase ? (
        /* ─── Level 1: Case List ─── */
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Treatments</h1>
            <p className="text-gray-600">View reports, notes, appointments, and treatment plans from your dermatologists.</p>
          </div>

          {activeCases.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No active treatments"
              message="Once a dermatologist accepts your case and starts adding reports or treatment plans, they will appear here."
            />
          ) : (
            <div className="space-y-4">
              {activeCases.map((c, index) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="cursor-pointer"
                  onClick={() => loadFullCase(c)}
                >
                  <Card className="p-5 flex justify-between items-center border-2 border-slate-100 hover:border-emerald-500 transition-all shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 shrink-0 shadow-sm">
                        {c.doctor?.profilePhoto ? (
                          <img
                            src={`${apiUrl}/${c.doctor.profilePhoto.replace(/\\/g, '/')}`}
                            alt={c.doctor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={c.doctor?.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                            alt="Doctor"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {c.doctor?.name || 'Dermatologist'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {c.complaintType ? c.complaintType.charAt(0).toUpperCase() + c.complaintType.slice(1) : ''} case
                          {' · '}Appointment {c.appointmentDate ? formatDate(c.appointmentDate) : '—'}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          <span>{(c.reports || []).length} reports</span>
                          <span>{(c.clinicalNotes || []).length} notes</span>
                          <span>{(c.followUps || []).length} follow-ups</span>
                          <span>{(c.comparisons || []).length} comparisons</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── Level 2: Case Details ─── */
        <div>
          <Button variant="outline" className="mb-4" onClick={() => setSelectedCase(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Treatments
          </Button>

          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-emerald-50 border-4 border-white shadow-xl shrink-0">
              {selectedCase.doctor?.profilePhoto ? (
                <img
                  src={`${apiUrl}/${selectedCase.doctor.profilePhoto.replace(/\\/g, '/')}`}
                  alt={selectedCase.doctor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={selectedCase.doctor?.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                  alt="Doctor"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCase.doctor?.name || 'Dermatologist'}
              </h2>
              <p className="text-gray-600 text-sm">
                {selectedCase.complaintType ? selectedCase.complaintType.charAt(0).toUpperCase() + selectedCase.complaintType.slice(1) : ''} case
                {' · '}{selectedCase.doctor?.specialty || 'Dermatology'}
              </p>
            </div>

            <div className="hidden md:block w-48 text-right">
              <div className="flex justify-between text-xs font-bold text-emerald-600 mb-1 uppercase tracking-tighter">
                <span>Treatment Progress</span>
                <span>{selectedCase.progress || 0}%</span>
              </div>
              <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedCase.progress || 0}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="md:hidden mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex justify-between text-xs font-bold text-emerald-600 mb-2 uppercase tracking-tighter">
              <span>Treatment Progress</span>
              <span>{selectedCase.progress || 0}%</span>
            </div>
            <div className="w-full h-3 bg-emerald-200/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${selectedCase.progress || 0}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`py-3 px-4 font-medium text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab(tab)}
              >
                {getIcon(tab)} {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">

            {/* ─── Reports ─── */}
            {activeTab === 'Reports' && (
              <div className="space-y-3">
                {(selectedCase.reports || []).length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">No reports from your dermatologist yet.</Card>
                ) : (
                  (selectedCase.reports || []).map((r) => (
                    <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-emerald-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex items-start gap-3">
                            {getIcon('Reports')}
                            <div>
                              <p className="font-semibold text-gray-900">{r.title}</p>
                              {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 shrink-0">{formatDateTime(r.createdAt)}</div>
                        </div>
                        {r.filePath && (
                          <a
                            className="inline-flex items-center gap-2 mt-3 text-sm text-emerald-700 font-semibold hover:underline"
                            href={`${apiUrl}/${String(r.filePath).replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="w-4 h-4" /> Open attachment
                          </a>
                        )}
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* ─── Notes ─── */}
            {activeTab === 'Notes' && (
              <div className="space-y-3">
                {(selectedCase.clinicalNotes || []).length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">No clinical notes from your dermatologist yet.</Card>
                ) : (
                  (selectedCase.clinicalNotes || []).map((n) => (
                    <motion.div key={n._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          {getIcon('Notes')}
                          <span className="text-sm text-gray-500">{formatDateTime(n.createdAt)}</span>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* ─── Appointments ─── */}
            {activeTab === 'Appointments' && (
              <div className="space-y-6">
                {/* Original appointment */}
                <Card className="p-5 bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <p className="font-semibold text-emerald-900">Original Appointment</p>
                  </div>
                  <p className="text-sm text-emerald-800 ml-8">
                    {selectedCase.appointmentDate ? formatDate(selectedCase.appointmentDate) : '—'}
                    {selectedCase.appointmentTimeSlot ? ` at ${formatTime(selectedCase.appointmentTimeSlot)}` : ''}
                  </p>
                </Card>

                {/* Upcoming follow-ups */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Upcoming Follow-ups
                  </h3>
                  {upcomingFollowUps.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-6">No upcoming follow-ups scheduled.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingFollowUps.map((f) => (
                        <Card key={f._id} className="p-4 shadow-sm border-l-4 border-blue-500">
                          <p className="font-medium text-gray-900">
                            {formatDate(f.date)} at {formatTime(f.timeSlot)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{f.reason || 'Follow-up'}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Previous follow-ups */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Previous Follow-ups
                  </h3>
                  {previousFollowUps.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-6">No previous follow-ups.</p>
                  ) : (
                    <div className="space-y-2">
                      {previousFollowUps.map((f) => (
                        <Card key={f._id} className="p-4 shadow-sm bg-gray-50">
                          <p className="font-medium text-gray-900">
                            {formatDate(f.date)} at {formatTime(f.timeSlot)}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{f.reason || 'Follow-up'}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Comparisons ─── */}
            {activeTab === 'Comparisons' && (
              <div className="space-y-6">
                {(selectedCase.comparisons || []).length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">No before/after comparisons added by your dermatologist yet.</Card>
                ) : (
                  <>
                    {/* Slider viewer */}
                    {selectedComparison && (
                      <div className="relative h-80 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                        <div className="absolute inset-0 flex">
                          <div className="flex-1 relative" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                            <img
                              src={`${apiUrl}/${String(selectedComparison.beforePath).replace(/\\/g, '/')}`}
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow">Before</div>
                          </div>
                          <div className="flex-1 relative">
                            <img
                              src={`${apiUrl}/${String(selectedComparison.afterPath).replace(/\\/g, '/')}`}
                              alt="After"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow">After</div>
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
                    )}

                    {/* Comparison list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedCase.comparisons || []).map((cmp) => (
                        <button
                          key={cmp._id}
                          type="button"
                          onClick={() => { setSelectedComparison(cmp); setSlider(50) }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selectedComparison?._id === cmp._id
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <ImageIcon className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="font-semibold text-gray-900">Comparison</p>
                              <p className="text-xs text-gray-500">{formatDateTime(cmp.createdAt)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── Treatment Plan ─── */}
            {activeTab === 'Treatment Plan' && (
              <div className="space-y-6">
                {!tp.updatedAt && (tp.medications || []).length === 0 && !(tp.notes) ? (
                  <Card className="p-8 text-center text-gray-500">Your dermatologist hasn't created a treatment plan yet.</Card>
                ) : (
                  <>
                    {/* Medications */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-rose-500" /> Medications
                      </h3>
                      {(tp.medications || []).length === 0 ? (
                        <p className="text-sm text-gray-500 ml-7">No medications prescribed yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {tp.medications.map((med, idx) => (
                            <Card key={idx} className="p-4 shadow-sm border-l-4 border-rose-400">
                              <p className="font-semibold text-gray-900">{med.name}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosage}{med.duration ? ` · ${med.duration}` : ''}
                              </p>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lifestyle */}
                    {(tp.lifestyle || []).length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-pink-500" /> Lifestyle Recommendations
                        </h3>
                        <Card className="p-4 shadow-sm">
                          <ul className="space-y-2">
                            {tp.lifestyle.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-800">
                                <span className="text-emerald-500 mt-1">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    )}

                    {/* Doctor notes */}
                    {tp.notes && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-yellow-500" /> Doctor's Notes
                        </h3>
                        <Card className="p-4 shadow-sm">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{tp.notes}</p>
                        </Card>
                      </div>
                    )}

                    {tp.updatedAt && (
                      <p className="text-xs text-gray-400 text-right">
                        Last updated: {formatDateTime(tp.updatedAt)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TreatmentDashboard
