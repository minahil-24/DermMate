import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle, Camera, AlertCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { IMAGE_ANGLES } from '../../utils/constants'

const ImageUpload = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)
  const [uploadedImages, setUploadedImages] = useState({})
  const [dragActive, setDragActive] = useState(false)

  const requiredAngles = [
    { id: 'front', label: 'Front View', description: 'Full face/scalp front view' },
    { id: 'side', label: 'Side View', description: 'Left or right side profile' },
    { id: 'back', label: 'Back View', description: 'Back of head/scalp' },
    { id: 'top', label: 'Top View', description: 'Top-down view of affected area' },
  ]

  const handleFileSelect = (angle, file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImages({
          ...uploadedImages,
          [angle]: {
            file,
            preview: e.target.result,
            uploadedAt: new Date().toISOString(),
          },
        })
        addToast({
          type: 'success',
          title: 'Image Uploaded',
          message: `${angle} view uploaded successfully`,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e, angle) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(angle, file)
  }

  const removeImage = (angle) => {
    const newImages = { ...uploadedImages }
    delete newImages[angle]
    setUploadedImages(newImages)
  }

  const allAnglesUploaded = requiredAngles.every(angle => uploadedImages[angle.id])

  const handleContinue = () => {
    if (allAnglesUploaded) {
      navigate('/patient/ai-detection', { state: { images: uploadedImages } })
    } else {
      addToast({
        type: 'warning',
        title: 'Incomplete Upload',
        message: 'Please upload images from all required angles',
      })
    }
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'New Complaint', link: '/patient/complaint' },
        { label: 'Image Upload' },
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Images</h1>
        <p className="text-gray-600">Please upload images from multiple angles for better diagnosis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {requiredAngles.map((angle, index) => {
          const isUploaded = uploadedImages[angle.id]
          
          return (
            <motion.div
              key={angle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{angle.label}</h3>
                    <p className="text-sm text-gray-600">{angle.description}</p>
                  </div>
                  {isUploaded && (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  )}
                </div>

                {isUploaded ? (
                  <div className="relative">
                    <img
                      src={isUploaded.preview}
                      alt={angle.label}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(angle.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => handleDrop(e, angle.id)}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Drag and drop or click to upload</p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(angle.id, e.target.files[0])}
                      />
                      <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </span>
                    </label>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Image Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use good lighting and clear focus</li>
              <li>• Ensure the affected area is clearly visible</li>
              <li>• Remove any obstructions (hats, hair products)</li>
              <li>• Take photos from the specified angles</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {Object.keys(uploadedImages).length} of {requiredAngles.length} angles uploaded
        </div>
        <Button
          onClick={handleContinue}
          disabled={!allAnglesUploaded}
          size="lg"
        >
          Continue to AI Analysis
        </Button>
      </div>
    </div>
  )
}

export default ImageUpload
