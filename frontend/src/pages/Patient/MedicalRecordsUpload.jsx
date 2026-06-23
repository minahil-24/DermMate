import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, FileText, Loader2, SkipForward, CheckSquare, Square } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { mergeBooking, loadBooking, redirectDraftResubmitToSchedule } from '../../utils/bookingFlow'
import { formatDate } from '../../utils/helpers'

const MedicalRecordsUpload = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [savedRecords, setSavedRecords] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [uploading, setUploading] = useState(false)

  const doctorId = location.state?.doctorId || loadBooking().doctorId
  const complaintType = location.state?.complaintType || loadBooking().complaintType

  useEffect(() => {
    if (redirectDraftResubmitToSchedule(navigate, location)) return
    if (!doctorId || !complaintType) {
      navigate('/patient/dermatologists', { replace: true })
    }
  }, [doctorId, complaintType, navigate, location])

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/medical-records`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const records = res.data.records || []
        setSavedRecords(records)

        const bookingFiles = loadBooking().medicalHistoryFiles || []
        if (bookingFiles.length && records.length) {
          const paths = new Set(bookingFiles.map((f) => f.filePath))
          const preselected = new Set(
            records.filter((r) => paths.has(r.filePath)).map((r) => r._id)
          )
          if (preselected.size) setSelectedIds(preselected)
        }
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not load saved records',
          message: err.response?.data?.message || err.message,
        })
      } finally {
        setLoadingSaved(false)
      }
    }
    if (token) loadSaved()
  }, [token, apiUrl, addToast])

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name)
    const res = await axios.post(`${apiUrl}/api/medical-records/upload`, fd, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    })
    return res.data.record
  }

  const onSelectFiles = async (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    setUploading(true)
    try {
      const newRecords = []
      for (const file of list) {
        newRecords.push(await uploadFile(file))
      }
      setSavedRecords((prev) => [...newRecords, ...prev])
      setSelectedIds((prev) => {
        const next = new Set(prev)
        newRecords.forEach((r) => next.add(r._id))
        return next
      })
      addToast({ type: 'success', title: 'Uploaded', message: 'Record(s) saved to your library and selected' })
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

  const toggleRecord = (recordId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  const buildSelectedFiles = () =>
    savedRecords
      .filter((r) => selectedIds.has(r._id))
      .map((r) => ({ filePath: r.filePath, originalName: r.originalName || r.title || 'Medical record' }))

  const continueNext = () => {
    const medicalHistoryFiles = buildSelectedFiles()
    mergeBooking({ medicalHistoryFiles })
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

  const selectedCount = selectedIds.size

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
          Select saved reports from your library or upload new ones (optional). Selected records will be
          shared with the dermatologist for this appointment.
        </p>
      </div>

      {loadingSaved ? (
        <Card className="p-12 flex justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </Card>
      ) : savedRecords.length > 0 ? (
        <Card className="p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-1">Your saved records</h2>
          <p className="text-sm text-gray-500 mb-4">
            Tap to select records to include with this appointment ({selectedCount} selected)
          </p>
          <ul className="space-y-2">
            {savedRecords.map((record) => {
              const isSelected = selectedIds.has(record._id)
              const name = record.title || record.originalName || 'Medical record'
              return (
                <li key={record._id}>
                  <button
                    type="button"
                    onClick={() => toggleRecord(record._id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border-2 border-emerald-300'
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                      {record.uploadedAt && (
                        <p className="text-xs text-gray-500">{formatDate(record.uploadedAt)}</p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <Card className="p-6 mb-6 bg-slate-50 border-dashed">
          <p className="text-sm text-gray-600">
            No saved records yet. Upload files below — they will be saved to your Medical Records library
            for future appointments.
          </p>
        </Card>
      )}

      <Card className="p-8 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Upload new record</h2>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 rounded-2xl p-10 cursor-pointer hover:bg-emerald-50/50">
          <input
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={onSelectFiles}
          />
          {uploading ? (
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-emerald-400 mb-4" />
          )}
          <span className="font-semibold text-gray-900">Add files</span>
          <span className="text-sm text-gray-500 mt-1">Images or PDF — saved to your library</span>
        </label>
      </Card>

      <div className="flex flex-wrap justify-between gap-4">
        <Button type="button" variant="outline" onClick={skip} className="gap-2">
          <SkipForward className="w-4 h-4" /> Skip (no records)
        </Button>
        <Button onClick={continueNext} disabled={uploading}>
          Continue to affected area photos
          {selectedCount > 0 ? ` (${selectedCount} record${selectedCount !== 1 ? 's' : ''})` : ''}
        </Button>
      </div>
    </div>
  )
}

export default MedicalRecordsUpload
