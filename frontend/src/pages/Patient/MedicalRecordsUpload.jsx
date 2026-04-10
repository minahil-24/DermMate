import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, FileText, Loader2, SkipForward } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { mergeBooking, loadBooking, redirectDraftResubmitToSchedule } from '../../utils/bookingFlow'

const MedicalRecordsUpload = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const doctorId = location.state?.doctorId || loadBooking().doctorId
  const complaintType = location.state?.complaintType || loadBooking().complaintType

  useEffect(() => {
    if (redirectDraftResubmitToSchedule(navigate, location)) return
    if (!doctorId || !complaintType) {
      navigate('/patient/dermatologists', { replace: true })
    }
  }, [doctorId, complaintType, navigate, location])

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await axios.post(`${apiUrl}/api/cases/upload?type=medical`, fd, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
    return { filePath: res.data.filePath, originalName: res.data.originalName || file.name }
  }

  const onSelect = async (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    setUploading(true)
    try {
      const uploaded = []
      for (const file of list) {
        uploaded.push(await uploadFile(file))
      }
      const next = [...files, ...uploaded]
      setFiles(next)
      mergeBooking({ medicalHistoryFiles: next })
      addToast({ type: 'success', title: 'Uploaded', message: 'Medical record(s) saved' })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: err.response?.data?.message || err.message,
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeAt = (idx) => {
    const next = files.filter((_, i) => i !== idx)
    setFiles(next)
    mergeBooking({ medicalHistoryFiles: next })
  }

  const continueNext = () => {
    mergeBooking({ medicalHistoryFiles: files })
    navigate('/patient/booking/affected-images', {
      state: { doctorId, complaintType, bookingFlow: true },
    })
  }

  const skip = () => {
    mergeBooking({ medicalHistoryFiles: [] })
    navigate('/patient/booking/affected-images', {
      state: { doctorId, complaintType, bookingFlow: true },
    })
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Find Specialist', link: '/patient/dermatologists' },
          { label: 'Medical records' },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical history & records</h1>
        <p className="text-gray-600">
          Upload any prior lab reports, prescriptions, or photos (optional). PDF or images up to 10MB each.
        </p>
      </div>

      <Card className="p-8 mb-6">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 rounded-2xl p-12 cursor-pointer hover:bg-emerald-50/50">
          <input
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={onSelect}
          />
          {uploading ? (
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-emerald-400 mb-4" />
          )}
          <span className="font-semibold text-gray-900">Add files</span>
          <span className="text-sm text-gray-500 mt-1">Images or PDF</span>
        </label>

        {files.length > 0 && (
          <ul className="mt-6 space-y-2">
            {files.map((f, idx) => (
              <li
                key={`${f.filePath}-${idx}`}
                className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800 truncate">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  {f.originalName || f.filePath}
                </span>
                <button
                  type="button"
                  className="text-red-500 text-sm font-semibold"
                  onClick={() => removeAt(idx)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap justify-between gap-4">
        <Button type="button" variant="outline" onClick={skip} className="gap-2">
          <SkipForward className="w-4 h-4" /> Skip (no records)
        </Button>
        <Button onClick={continueNext} disabled={uploading}>
          Continue to affected area photos
        </Button>
      </div>
    </div>
  )
}

export default MedicalRecordsUpload
