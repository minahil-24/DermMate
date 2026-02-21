import { motion } from 'framer-motion'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const DermatologistVerification = () => {
  const addToast = useToastStore((state) => state.addToast)
  const pendingVerifications = [
    { id: '1', name: 'Dr. John Smith', email: 'john@example.com', certification: 'certificate.pdf', submittedAt: '2024-12-15' },
    { id: '2', name: 'Dr. Jane Doe', email: 'jane@example.com', certification: 'certificate.pdf', submittedAt: '2024-12-14' },
  ]

  const handleApprove = (id) => {
    addToast({ type: 'success', title: 'Approved', message: 'Dermatologist certification approved' })
  }

  const handleReject = (id) => {
    addToast({ type: 'info', title: 'Rejected', message: 'Certification request rejected' })
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dermatologist Verification' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification</h1>
        <p className="text-gray-600">Review and verify dermatologist certifications</p>
      </div>
      <div className="space-y-4">
        {pendingVerifications.map((verification, index) => (
          <motion.div key={verification.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{verification.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{verification.email}</p>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700">{verification.certification}</a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleApprove(verification.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleReject(verification.id)}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default DermatologistVerification
