import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Image } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const ImageValidation = () => {
  const validations = [
    { id: '1', imageId: 'img-1', status: 'valid', quality: 95, issues: [] },
    { id: '2', imageId: 'img-2', status: 'invalid', quality: 45, issues: ['Low resolution', 'Poor lighting'] },
    { id: '3', imageId: 'img-3', status: 'valid', quality: 92, issues: [] },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Image Validation' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Quality Validation</h1>
        <p className="text-gray-600">System validation of uploaded images</p>
      </div>
      <div className="space-y-4">
        {validations.map((validation, index) => (
          <motion.div key={validation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    validation.status === 'valid' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {validation.status === 'valid' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Image {validation.imageId}</h3>
                    <p className="text-sm text-gray-600">Quality Score: {validation.quality}%</p>
                    {validation.issues.length > 0 && (
                      <div className="mt-1">
                        {validation.issues.map((issue, i) => (
                          <span key={i} className="text-xs text-red-600 mr-2">• {issue}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  validation.status === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {validation.status}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ImageValidation
