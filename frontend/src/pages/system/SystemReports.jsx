import { motion } from 'framer-motion'
import { FileText, Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const SystemReports = () => {
  const reports = [
    { id: '1', name: 'Monthly Usage Report', generatedAt: '2024-12-01', type: 'PDF' },
    { id: '2', name: 'User Activity Summary', generatedAt: '2024-12-10', type: 'CSV' },
    { id: '3', name: 'AI Model Performance', generatedAt: '2024-12-15', type: 'PDF' },
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'System Reports' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Reports</h1>
        <p className="text-gray-600">Generated system reports and analytics</p>
      </div>
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Reports</h2>
        <div className="space-y-3">
          {reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-600">Generated: {report.generatedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">{report.type}</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default SystemReports
