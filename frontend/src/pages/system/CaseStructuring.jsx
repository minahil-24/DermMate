import { motion } from 'framer-motion'
import { FileText, CheckCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const CaseStructuring = () => {
  const caseStructure = {
    questionnaire: { status: 'complete', fields: 12 },
    images: { status: 'complete', count: 4 },
    aiResults: { status: 'complete', confidence: 87 },
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Case Structuring' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Case Structuring</h1>
        <p className="text-gray-600">Automated case data organization</p>
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Case Components</h2>
        <div className="space-y-4">
          {Object.entries(caseStructure).map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-sm text-gray-600">
                    {key === 'questionnaire' ? `${value.fields} fields` :
                     key === 'images' ? `${value.count} images` :
                     `${value.confidence}% confidence`}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                {value.status}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default CaseStructuring
