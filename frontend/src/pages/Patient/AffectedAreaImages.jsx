import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, X, Camera, Loader2 } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { mergeBooking, loadBooking, redirectDraftResubmitToSchedule } from '../../utils/bookingFlow'

const MAX_IMAGES = 3

const AffectedAreaImages = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const [images, setImages] = useState([])
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

  const uploadOne = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await axios.post(`${apiUrl}/api/cases/upload?type=affected`, fd, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    })
    return {
      filePath: res.data.filePath,
      originalName: res.data.originalName || file.name,
      complaintType,
    }
  }

  const onFiles = async (fileList) => {
    const arr = Array.from(fileList || [])
    if (!arr.length) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      addToast({ type: 'warning', title: 'Limit reached', message: `Maximum ${MAX_IMAGES} images.` })
      return
    }
    const take = arr.slice(0, room)
    setUploading(true)
    try {
      const uploaded = []
      for (const file of take) {
        if (!file.type.startsWith('image/')) {
          addToast({ type: 'error', title: 'Invalid file', message: 'Only images for affected area.' })
          continue
        }
        uploaded.push(await uploadOne(file))
      }
      const next = [...images, ...uploaded]
      setImages(next)
      mergeBooking({ affectedImages: next })
      addToast({ type: 'success', title: 'Saved', message: 'Image(s) uploaded' })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: err.response?.data?.message || err.message,
      })
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (idx) => {
    const next = images.filter((_, i) => i !== idx)
    setImages(next)
    mergeBooking({ affectedImages: next })
  }

  const continueNext = () => {
    if (images.length < 1) {
      addToast({ type: 'warning', title: 'Required', message: 'Please upload at least one image of the affected area.' })
      return
    }
    mergeBooking({ affectedImages: images })
    navigate('/patient/booking/schedule', {
      state: { doctorId, complaintType, bookingFlow: true },
    })
  }

  const tagLabel =
    complaintType === 'skin' ? 'Skin' : complaintType === 'hair' ? 'Hair / scalp' : 'Nails'

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Booking', link: '/patient/booking/complaint' },
          { label: 'Affected area images' },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Affected area — {tagLabel}</h1>
        <p className="text-gray-600">
          Upload 1–3 clear photos of the affected area. Start with one image; use &quot;Add more&quot; for up to{' '}
          {MAX_IMAGES} total.
        </p>
        <p className="text-sm text-emerald-700 font-medium mt-2">Category tag: {complaintType}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {images.map((img, idx) => (
          <Card key={`${img.filePath}-${idx}`} className="p-4 relative overflow-hidden">
            <img
              src={`${apiUrl}/${img.filePath.replace(/\\/g, '/')}`}
              alt=""
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
              onClick={() => removeAt(idx)}
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-500 mt-2 truncate">{img.originalName}</p>
          </Card>
        ))}
      </div>

      <Card className="p-8 mb-8">
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer hover:bg-slate-50">
          <input
            type="file"
            accept="image/*"
            multiple={false}
            className="hidden"
            disabled={uploading || images.length >= MAX_IMAGES}
            onChange={(e) => onFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          ) : (
            <Camera className="w-12 h-12 text-slate-400 mb-4" />
          )}
          <span className="font-bold text-gray-900">
            {images.length === 0 ? 'Upload first image' : images.length < MAX_IMAGES ? 'Add more images' : 'Maximum reached'}
          </span>
          <span className="text-sm text-gray-500 mt-1">
            {images.length} / {MAX_IMAGES} images
          </span>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button onClick={continueNext} disabled={uploading || images.length < 1}>
          Continue to schedule & payment
        </Button>
      </div>
    </div>
  )
}

export default AffectedAreaImages
