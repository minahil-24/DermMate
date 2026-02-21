import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { formatDate } from '../../utils/helpers'

const MedicalRecords = () => {
  const [expandedVisits, setExpandedVisits] = useState([])

  const visits = [
    {
      id: '1',
      date: '2024-12-10',
      dermatologist: 'Dr. Sarah Johnson',
      type: 'Follow-up',
      diagnosis: 'Androgenetic Alopecia - Moderate',
      treatment: 'Minoxidil 5%, Finasteride 1mg',
      notes: 'Patient showing positive response to treatment. Hair density improved by 15%. Continue current regimen.',
      images: 3,
    },
    {
      id: '2',
      date: '2024-11-15',
      dermatologist: 'Dr. Sarah Johnson',
      type: 'Initial Consultation',
      diagnosis: 'Androgenetic Alopecia - Moderate',
      treatment: 'Minoxidil 5%, Finasteride 1mg',
      notes: 'Initial consultation. Patient presents with moderate hair thinning. Treatment plan initiated.',
      images: 4,
    },
  ]

  const toggleVisit = (visitId) => {
    setExpandedVisits(
      expandedVisits.includes(visitId)
        ? expandedVisits.filter(id => id !== visitId)
        : [...expandedVisits, visitId]
    )
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Medical Records' }]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Records</h1>
        <p className="text-gray-600">View your complete medical history and visit records</p>
      </div>

      <div className="space-y-4">
        {visits.map((visit, index) => {
          const isExpanded = expandedVisits.includes(visit.id)
          
          return (
            <motion.div
              key={visit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleVisit(visit.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{visit.type}</h3>
                      <p className="text-sm text-gray-600">{formatDate(visit.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{visit.dermatologist}</p>
                      <p className="text-xs text-gray-600">{visit.images} images</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-gray-200 space-y-3"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h4>
                      <p className="text-sm text-gray-900">{visit.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Treatment</h4>
                      <p className="text-sm text-gray-900">{visit.treatment}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Clinical Notes</h4>
                      <p className="text-sm text-gray-600">{visit.notes}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100">
                        View Images
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                        Download Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default MedicalRecords
