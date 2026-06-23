import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, AlertCircle, CheckCircle2, Loader2,
  Stethoscope, Camera, ImagePlus, Upload, FileDown, X,
} from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatTime, formatDateTime } from '../../utils/helpers'

const needsSubmission = (f) => f.status !== 'submitted' && !f.pdfReportPath

const FollowUp = () => {
  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [activeFollowUp, setActiveFollowUp] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

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
          caseDoctorSpecialty: c.doctor?.specialty,
          caseDoctorDegree: c.doctor?.degree,
          caseDoctorEmail: c.doctor?.email,
          caseDoctorClinic: c.doctor?.clinicName,
          caseComplaint: c.complaintType,
          caseId: c._id,
        })
      }
    }
    return fups
  }, [cases])

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

  const openSubmitModal = (followUp) => {
    setActiveFollowUp(followUp)
    setSelectedImage(null)
    setPreviewUrl(null)
    setSubmitModalOpen(true)
  }

  const closeSubmitModal = () => {
    setSubmitModalOpen(false)
    setActiveFollowUp(null)
    setSelectedImage(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const onImageSelected = (fileList) => {
    const file = fileList?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Invalid file', message: 'Please select an image file.' })
      return
    }
    setSelectedImage(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const submitFollowUp = async () => {
    if (!activeFollowUp || !selectedImage) {
      addToast({ type: 'warning', title: 'Image required', message: 'Upload a photo of the affected area before submitting.' })
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedImage)
      const res = await axios.post(
        `${apiUrl}/api/cases/${activeFollowUp.caseId}/followups/${activeFollowUp._id}/submit`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      addToast({
        type: 'success',
        title: 'Follow-up submitted',
        message: 'Your report PDF has been generated.',
      })
      closeSubmitModal()
      await loadCases()
      if (res.data.pdfReportPath) {
        window.open(`${apiUrl}/${res.data.pdfReportPath.replace(/\\/g, '/')}`, '_blank')
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Submission failed',
        message: err.response?.data?.message || err.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const downloadPdf = (pdfPath) => {
    if (!pdfPath) return
    window.open(`${apiUrl}/${String(pdfPath).replace(/\\/g, '/')}`, '_blank')
  }

  const FollowUpCard = ({ f, idx, variant = 'default' }) => {
    const pending = needsSubmission(f)
    const border =
      variant === 'action' ? 'border-amber-500 bg-amber-50/30' :
      variant === 'upcoming' ? 'border-blue-500' : 'border-transparent bg-gray-50'

    return (
      <motion.div
        key={f._id || idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
      >
        <Card className={`p-5 border-l-4 ${border} shadow-sm hover:shadow-md transition-all rounded-2xl`}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="min-w-0">
              <p className="font-bold text-slate-900">
                {formatDate(f.date)} at {formatTime(f.timeSlot)}
              </p>
              <p className="text-sm text-gray-600 mt-1">{f.reason || 'Follow-up'}</p>
              <div className="mt-3 p-3 rounded-lg bg-white/80 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dermatologist</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shrink-0">
                    {f.caseDoctorPhoto ? (
                      <img src={`${apiUrl}/${f.caseDoctorPhoto.replace(/\\/g, '/')}`} alt={f.caseDoctorName} className="w-full h-full object-cover" />
                    ) : (
                      <img src={f.caseDoctorGender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'} alt="Doctor" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Dr. {f.caseDoctorName}</p>
                    <p className="text-xs text-gray-500">
                      {[f.caseDoctorSpecialty, f.caseDoctorDegree].filter(Boolean).join(' · ') || 'Dermatology'}
                    </p>
                    {f.caseDoctorEmail && (
                      <p className="text-xs text-gray-400 truncate">{f.caseDoctorEmail}</p>
                    )}
                    {f.caseDoctorClinic && (
                      <p className="text-xs text-gray-400 truncate">{f.caseDoctorClinic}</p>
                    )}
                  </div>
                </div>
              </div>
              {f.createdAt && (
                <p className="text-xs text-gray-400 mt-2">Scheduled {formatDateTime(f.createdAt)}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 capitalize">Case: {f.caseComplaint}</p>
              {f.status === 'submitted' && f.submittedAt && (
                <p className="text-xs text-emerald-600 font-medium mt-2">
                  Submitted {formatDate(f.submittedAt)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {pending ? (
                <Button size="sm" onClick={() => openSubmitModal(f)} className="gap-2">
                  <Upload className="w-4 h-4" /> Submit follow-up
                </Button>
              ) : (
                <>
                  {f.pdfReportPath && (
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(f.pdfReportPath)} className="gap-2">
                      <FileDown className="w-4 h-4" /> Download PDF
                    </Button>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> Submitted
                  </span>
                </>
              )}
            </div>
          </div>

          {f.patientImage?.filePath && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Uploaded image</p>
              <img
                src={`${apiUrl}/${f.patientImage.filePath.replace(/\\/g, '/')}`}
                alt="Follow-up"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </Card>
      </motion.div>
    )
  }

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
        <p className="text-sm text-slate-500 font-medium">
          Follow-up requests from your dermatologist appear here. Upload an affected area photo to generate your official report.
        </p>
      </header>

      {allFollowUps.length === 0 && originalAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments yet"
          message="When your dermatologist schedules a follow-up, it will appear here automatically."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-4 space-y-6">
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

          <div className="lg:col-span-8 space-y-8">

            {allFollowUps.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-600" /> All Follow-ups
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{allFollowUps.length}</span>
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Every follow-up scheduled by your dermatologist appears here with date, reason, and doctor details.
                </p>
                <div className="space-y-3">
                  {[...allFollowUps].sort((a, b) => new Date(b.date) - new Date(a.date)).map((f, idx) => (
                    <FollowUpCard key={f._id || idx} f={f} idx={idx} variant={needsSubmission(f) ? 'action' : 'default'} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={submitModalOpen}
        onClose={closeSubmitModal}
        title="Submit follow-up"
        size="md"
      >
        {activeFollowUp && (
          <div className="space-y-6">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-sm font-bold text-slate-900">
                {formatDate(activeFollowUp.date)} at {formatTime(activeFollowUp.timeSlot)}
              </p>
              <p className="text-sm text-slate-600 mt-1">{activeFollowUp.reason || 'Follow-up'}</p>
              <p className="text-xs text-slate-400 mt-1">Dr. {activeFollowUp.caseDoctorName}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">
                Affected area photo <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Take a new photo with your camera or choose an existing image from your gallery. This is required to generate your medical report PDF.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onImageSelected(e.target.files)}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onImageSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" /> Take photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4" /> Choose from gallery
                </Button>
              </div>

              {previewUrl ? (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-xl border object-contain" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"
                    onClick={() => {
                      setSelectedImage(null)
                      if (previewUrl) URL.revokeObjectURL(previewUrl)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-slate-500 mt-2">{selectedImage?.name}</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image selected</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={closeSubmitModal} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submitFollowUp} disabled={submitting || !selectedImage} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Submit & generate PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FollowUp
