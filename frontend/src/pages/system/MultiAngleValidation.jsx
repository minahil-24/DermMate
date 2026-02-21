import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const MultiAngleValidation = () => {
  const requiredAngles = ['front', 'side', 'back', 'top']
  const uploadedAngles = ['front', 'side', 'back']

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Multi-Angle Validation' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-Angle Validation</h1>
        <p className="text-gray-600">Validate required image angles</p>
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Required Angles Checklist</h2>
        <div className="space-y-3">
          {requiredAngles.map((angle, index) => {
            const isUploaded = uploadedAngles.includes(angle)
            return (
              <motion.div
                key={angle}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {isUploaded ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900 capitalize">{angle} View</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isUploaded ? 'Uploaded' : 'Missing'}
                </span>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default MultiAngleValidation
