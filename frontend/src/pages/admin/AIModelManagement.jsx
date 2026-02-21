import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, History } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const AIModelManagement = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [selectedFile, setSelectedFile] = useState(null)
  const modelVersions = [
    { version: 'v2.1.0', uploadedAt: '2024-12-10', status: 'active', accuracy: '92%' },
    { version: 'v2.0.0', uploadedAt: '2024-11-15', status: 'archived', accuracy: '89%' },
    { version: 'v1.5.0', uploadedAt: '2024-10-20', status: 'archived', accuracy: '87%' },
  ]

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      addToast({ type: 'success', title: 'File Selected', message: 'Model file ready for upload' })
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      addToast({ type: 'success', title: 'Model Uploaded', message: 'AI model uploaded successfully' })
      setSelectedFile(null)
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'AI Model Management' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Model Management</h1>
        <p className="text-gray-600">Upload and manage AI model versions</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Upload New Model</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model File</label>
              <input
                type="file"
                accept=".h5,.pkl,.pt,.onnx"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            {selectedFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
            <Button onClick={handleUpload} disabled={!selectedFile} className="w-full">
              Upload Model
            </Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
          </div>
          <div className="space-y-3">
            {modelVersions.map((version, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{version.version}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    version.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {version.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Uploaded: {version.uploadedAt}</p>
                  <p>Accuracy: {version.accuracy}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AIModelManagement
