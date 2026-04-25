import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, User, Clock, AlertCircle, CheckCircle2, Loader2,
  Stethoscope, ArrowRight
} from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime } from '../../utils/helpers'

const FollowUp = () => {
  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])

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
      addToast({ type: 'error', title: 'Error', message: 'Could not load appointments' })
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl, addToast])

  useEffect(() => { loadCases() }, [loadCases])

  const now = new Date()

  /* Collect all follow-ups across all accepted cases */
  const allFollowUps = useMemo(() => {
    const fups = []
    for (const c of cases) {
      if (c.isCancelledByPatient || c.doctorReviewStatus !== 'accepted') continue
      for (const f of (c.followUps || [])) {
        fups.push({
          ...f,
          caseDoctorName: c.doctor?.name || 'Dermatologist',
          caseDoctorPhoto: c.doctor?.profilePhoto,
          caseDoctorGender: c.doctor?.gender,
          caseComplaint: c.complaintType,
          caseId: c._id,
        })
      }
    }
    return fups
  }, [cases])

  const upcoming = useMemo(
    () => allFollowUps.filter((f) => new Date(f.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [allFollowUps]
  )

  const previous = useMemo(
    () => allFollowUps.filter((f) => new Date(f.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [allFollowUps]
  )

  /* Collect all original appointments from accepted cases */
  const originalAppointments = useMemo(() =>
    cases
      .filter((c) => !c.isCancelledByPatient && c.doctorReviewStatus === 'accepted')
      .map((c) => ({
        doctor: c.doctor?.name || 'Dermatologist',
        doctorPhoto: c.doctor?.profilePhoto,
        doctorGender: c.doctor?.gender,
        date: c.appointmentDate,
        timeSlot: c.appointmentTimeSlot,
        complaint: c.complaintType,
        id: c._id,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [cases]
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 text-slate-900 font-sans antialiased">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'Follow-ups & Appointments' }]} />

      <header className="mt-8 mb-10 border-b-2 border-slate-100 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Appointments</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Follow-ups & Appointments</h1>
        <p className="text-sm text-slate-500 font-medium">All your appointments and scheduled follow-ups across all cases.</p>
      </header>

      {allFollowUps.length === 0 && originalAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments yet"
          message="Your dermatologists have not scheduled any follow-up appointments yet. Once they do, they will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Original Appointments */}
          <div className="lg:col-span-4">
            <Card className="border-2 border-slate-200 rounded-3xl p-6 bg-white shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                <Stethoscope size={14} className="text-emerald-600" /> Original Appointments
              </h2>

              <div className="space-y-3">
                {originalAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden">
                      {apt.doctorPhoto ? (
                        <img src={`${apiUrl}/${apt.doctorPhoto.replace(/\\/g, '/')}`} alt={apt.doctor} className="w-full h-full object-cover" />
                      ) : (
                        <img src={apt.doctorGender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'} alt="Doctor" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{apt.doctor}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {apt.date ? formatDate(apt.date) : '—'}
                        {apt.timeSlot ? ` at ${formatTime(apt.timeSlot)}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{apt.complaint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Follow-ups */}
          <div className="lg:col-span-8 space-y-8">
            {/* Upcoming */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-500" /> Upcoming Follow-ups
                {upcoming.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{upcoming.length}</span>
                )}
              </h2>
              {upcoming.length === 0 ? (
                <Card className="p-6 text-center text-gray-500 rounded-2xl">No upcoming follow-ups scheduled.</Card>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((f, idx) => (
                    <motion.div key={f._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="p-5 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all rounded-2xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900">
                              {formatDate(f.date)} at {formatTime(f.timeSlot)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{f.reason || 'Follow-up'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100 shrink-0">
                                  {f.caseDoctorPhoto ? (
                                    <img src={`${apiUrl}/${f.caseDoctorPhoto.replace(/\\/g, '/')}`} alt={f.caseDoctorName} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={f.caseDoctorGender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'} alt="Doctor" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                                  {f.caseDoctorName}
                                  <span className="ml-1 opacity-50 font-medium capitalize">· {f.caseComplaint}</span>
                                </p>
                              </div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-500" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-gray-400" /> Previous Follow-ups
              </h2>
              {previous.length === 0 ? (
                <Card className="p-6 text-center text-gray-500 rounded-2xl">No previous follow-ups.</Card>
              ) : (
                <div className="space-y-3">
                  {previous.map((f, idx) => (
                    <motion.div key={f._id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="p-4 bg-gray-50 shadow-sm rounded-2xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800">
                              {formatDate(f.date)} at {formatTime(f.timeSlot)}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">{f.reason || 'Follow-up'}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100 shrink-0 grayscale">
                                  {f.caseDoctorPhoto ? (
                                    <img src={`${apiUrl}/${f.caseDoctorPhoto.replace(/\\/g, '/')}`} alt={f.caseDoctorName} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={f.caseDoctorGender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'} alt="Doctor" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                                  {f.caseDoctorName}
                                </p>
                              </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default FollowUp