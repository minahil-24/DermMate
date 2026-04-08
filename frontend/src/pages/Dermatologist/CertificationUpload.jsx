import { useState } from 'react'
import { Upload, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { CERTIFICATION_STATUS } from '../../utils/constants'

const CertificationUpload = () => {
  const addToast = useToastStore((state) => state.addToast)

  const [certificates, setCertificates] = useState([
    {
      id: 1,
      name: 'MBBS Degree.pdf',
      size: '120 KB',
      status: CERTIFICATION_STATUS.APPROVED,
    },
    {
      id: 2,
      name: 'Dermatology License.jpg',
      size: '98 KB',
      status: CERTIFICATION_STATUS.PENDING,
    },
  ])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const newCert = {
      id: Date.now(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      status: CERTIFICATION_STATUS.PENDING,
    }

    setCertificates((prev) => [...prev, newCert])

    addToast({
      type: 'success',
      title: 'Uploaded',
      message: 'Certificate uploaded and sent for verification',
    })
  }

  const removeCertificate = (id) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id))
  }

  const getStatusStyle = (status) => {
    if (status === CERTIFICATION_STATUS.APPROVED)
      return 'bg-emerald-100 text-emerald-700'
    if (status === CERTIFICATION_STATUS.PENDING)
      return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Certification' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Certification Upload
        </h1>
        <p className="text-gray-600">
          Upload and manage your medical certifications
        </p>
      </div>

      <Card>
        {/* Uploaded Certificates */}
        <div className="space-y-4 mb-8">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border hover:shadow-sm transition"
            >
              <FileText className="w-10 h-10 text-emerald-600" />

              <div className="flex-1">
                <p className="font-semibold text-gray-900">{cert.name}</p>
                <p className="text-sm text-gray-500">{cert.size}</p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                  cert.status
                )}`}
              >
                {cert.status}
              </span>

              <button
                onClick={() => removeCertificate(cert.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <XCircle size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Upload More */}
        <label className="block">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-emerald-400 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-1">
              Click to upload another certificate
            </p>
            <p className="text-xs text-gray-500">
              PDF, JPG, PNG (Max 5MB)
            </p>
          </div>
        </label>
      </Card>
    </div>
  )
}

export default CertificationUpload
