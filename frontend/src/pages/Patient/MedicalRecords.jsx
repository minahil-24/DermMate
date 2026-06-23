import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Upload, Loader2, Trash2, Download, ExternalLink } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDate } from '../../utils/helpers'

const MedicalRecords = () => {
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/medical-records`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setRecords(res.data.records || [])
      } catch (err) {
        addToast({
          type: 'error',
          title: 'Could not load records',
          message: err.response?.data?.message || err.message,
        })
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchRecords()
  }, [token, apiUrl, addToast])

  const refreshRecords = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/medical-records`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRecords(res.data.records || [])
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load records',
        message: err.response?.data?.message || err.message,
      })
    }
  }

  const fileUrl = (filePath) => `${apiUrl}/${String(filePath).replace(/\\/g, '/')}`

  const isPdf = (nameOrPath) => /\.pdf$/i.test(nameOrPath || '')

  const onUpload = async (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    setUploading(true)
    try {
      for (const file of list) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', file.name)
        await axios.post(`${apiUrl}/api/medical-records/upload`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        })
      }
      await refreshRecords()
      addToast({ type: 'success', title: 'Saved', message: 'Medical record(s) uploaded to your library' })
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

  const onDelete = async (recordId) => {
    if (!window.confirm('Delete this record from your library?')) return
    setDeletingId(recordId)
    try {
      await axios.delete(`${apiUrl}/api/medical-records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRecords((prev) => prev.filter((r) => r._id !== recordId))
      addToast({ type: 'success', title: 'Deleted', message: 'Record removed' })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: err.response?.data?.message || err.message,
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Medical Records' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Records</h1>
        <p className="text-gray-600">
          Upload and save your previous lab reports, prescriptions, or medical documents. When you book a
          new appointment, you can select any of these records to share with your dermatologist.
        </p>
      </div>

      <Card className="p-8 mb-8">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 rounded-2xl p-12 cursor-pointer hover:bg-emerald-50/50">
          <input
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={onUpload}
          />
          {uploading ? (
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-emerald-400 mb-4" />
          )}
          <span className="font-semibold text-gray-900">Upload medical record</span>
          <span className="text-sm text-gray-500 mt-1">Images or PDF, up to 10MB each</span>
        </label>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No saved records yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload your previous reports above, or add them during appointment booking.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => {
            const name = record.title || record.originalName || 'Medical record'
            const path = record.filePath || ''
            const pdf = isPdf(record.originalName || path)

            return (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {record.uploadedAt ? formatDate(record.uploadedAt) : 'Saved record'}
                        </p>
                        {record.originalName && record.originalName !== name && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{record.originalName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={fileUrl(path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100"
                      >
                        {pdf ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        {pdf ? 'Download' : 'View'}
                      </a>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                        disabled={deletingId === record._id}
                        onClick={() => onDelete(record._id)}
                      >
                        {deletingId === record._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>

                  {!pdf && path && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <img
                        src={fileUrl(path)}
                        alt={name}
                        className="max-h-48 rounded-lg border object-contain"
                      />
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MedicalRecords
