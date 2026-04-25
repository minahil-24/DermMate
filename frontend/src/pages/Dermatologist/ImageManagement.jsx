import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Loader2, User, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import EmptyState from '../../components/common/EmptyState'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { formatDateTime } from '../../utils/helpers'

const ImageManagement = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [slider, setSlider] = useState(50)
  const [selectedComparison, setSelectedComparison] = useState(null)

  const loadCases = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(`${apiUrl}/api/cases/doctor/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCases(res.data || [])
    } catch {
      setCases([])
      addToast({ type: 'error', title: 'Error', message: 'Could not load cases' })
    } finally {
      setLoading(false)
    }
  }, [token, apiUrl, addToast])

  useEffect(() => { loadCases() }, [loadCases])

  /* Collect all comparisons across accepted cases */
  const allComparisons = useMemo(() => {
    const comps = []
    for (const c of cases) {
      if (c.isCancelledByPatient || c.doctorReviewStatus !== 'accepted') continue
      for (const cmp of (c.comparisons || [])) {
        comps.push({
          ...cmp,
          patientName: c.patient?.name || 'Unknown Patient',
          caseId: c._id,
          complaintType: c.complaintType,
        })
      }
    }
    return comps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [cases])

  /* Collect all patient-uploaded affected images */
  const allImages = useMemo(() => {
    const imgs = []
    for (const c of cases) {
      if (c.isCancelledByPatient || c.doctorReviewStatus !== 'accepted') continue
      for (const img of (c.affectedImages || [])) {
        imgs.push({
          ...img,
          patientName: c.patient?.name || 'Unknown Patient',
          caseId: c._id,
          complaintType: c.complaintType,
        })
      }
    }
    return imgs
  }, [cases])

  useEffect(() => {
    if (allComparisons.length > 0 && !selectedComparison) {
      setSelectedComparison(allComparisons[0])
    }
  }, [allComparisons])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Image Management' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Management</h1>
        <p className="text-gray-600">View all patient images and before/after comparisons across your cases. Open a case to upload new comparisons.</p>
      </div>

      {allComparisons.length === 0 && allImages.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No images yet"
          message="Accept patient cases and add before/after comparisons from the case workspace."
        />
      ) : (
        <div className="space-y-10">

          {/* Before/After Comparisons */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Before / After Comparisons</h2>

            {allComparisons.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">No comparisons uploaded yet. Open a case to add comparisons.</Card>
            ) : (
              <>
                {/* Slider */}
                {selectedComparison && (
                  <Card className="overflow-hidden mb-4">
                    <div className="relative h-96 rounded-lg overflow-hidden">
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
                    <div className="p-3 bg-gray-50 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{selectedComparison.patientName}</span>
                        <span className="capitalize text-gray-400">· {selectedComparison.complaintType}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/dermatologist/pcases/${selectedComparison.caseId}`)}
                        className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:underline"
                      >
                        Open case <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                )}

                {/* Comparison list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allComparisons.map((cmp, idx) => (
                    <button
                      key={cmp._id || idx}
                      type="button"
                      onClick={() => { setSelectedComparison(cmp); setSlider(50) }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedComparison?._id === cmp._id
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-purple-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{cmp.patientName}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(cmp.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Patient Uploaded Images */}
          {allImages.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Uploaded Images</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {allImages.map((img, idx) => (
                  <motion.div
                    key={`${img.filePath}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/dermatologist/pcases/${img.caseId}`)}
                  >
                    <img
                      src={`${apiUrl}/${String(img.filePath).replace(/\\/g, '/')}`}
                      alt={img.originalName || 'image'}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{img.patientName}</p>
                      <p className="text-xs text-gray-500 capitalize">{img.complaintType}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default ImageManagement
