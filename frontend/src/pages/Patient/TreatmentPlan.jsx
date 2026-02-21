import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, FileText, Clock, Image, ClipboardList, File } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Button from '../../components/ui/Button'
import { formatDate } from '../../utils/helpers'

// Mock treatment data
const mockTreatments = [
  {
    id: 'treatment-1',
    name: 'Eczema Management Plan',
    dermatologist: 'Dr. Sarah Johnson',
    lastUpdated: '2024-11-16T11:00:00',
    reports: [
      { id: 1, title: 'Initial Diagnosis', uploader: 'Dermatologist', date: '2024-11-05T14:00:00', description: 'Patient diagnosed with mild eczema' },
      { id: 2, title: 'Follow-up Report', uploader: 'Patient', date: '2024-11-15T12:00:00', description: 'Patient uploaded follow-up report' },
    ],
    notes: [
      { id: 1, title: 'Prescription Note', uploader: 'Dermatologist', date: '2024-11-16T11:00:00', description: 'Use topical corticosteroids twice daily' },
      { id: 2, title: 'Diet Recommendation', uploader: 'Dermatologist', date: '2024-11-07T10:00:00', description: 'Avoid dairy and nuts for 2 weeks' },
    ],
    appointments: [
      { id: 1, patient: 'Patient', date: '2024-11-01T10:30:00', description: 'Pre-visit appointment' },
      { id: 2, patient: 'Patient', date: '2024-11-12T15:00:00', description: 'Follow-up checkup' },
    ],
    comparisons: [
      { id: 1, type: 'before', uploader: 'Patient', date: '2024-11-01T10:30:00', image: 'https://via.placeholder.com/150' },
      { id: 2, type: 'after', uploader: 'Dermatologist', date: '2024-11-10T09:00:00', image: 'https://via.placeholder.com/150/00FF00' },
    ],
  },
  {
    id: 'treatment-2',
    name: 'Acne Control Plan',
    dermatologist: 'Dr. Ahmed Malik',
    lastUpdated: '2024-11-14T16:00:00',
    reports: [
      { id: 1, title: 'Acne Report', uploader: 'Dermatologist', date: '2024-11-06T13:00:00', description: 'Patient has moderate acne' },
    ],
    notes: [
      { id: 1, title: 'Treatment Plan', uploader: 'Dermatologist', date: '2024-11-06T13:00:00', description: 'Use salicylic acid cream daily' },
    ],
    appointments: [
      { id: 1, patient: 'Patient', date: '2024-11-03T09:00:00', description: 'Initial consultation' },
    ],
    comparisons: [
      { id: 1, type: 'before', uploader: 'Patient', date: '2024-11-03T09:00:00', image: 'https://via.placeholder.com/150/FF0000' },
      { id: 2, type: 'after', uploader: 'Dermatologist', date: '2024-11-12T15:00:00', image: 'https://via.placeholder.com/150/0000FF' },
    ],
  },
]

const tabs = ['Reports', 'Notes', 'Appointments', 'Comparisons']

const TreatmentDashboard = () => {
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [activeTab, setActiveTab] = useState('Reports')

  const getIcon = (type) => {
    switch (type) {
      case 'Reports': return <FileText className="w-5 h-5 text-emerald-500" />
      case 'Notes': return <ClipboardList className="w-5 h-5 text-yellow-500" />
      case 'Appointments': return <Calendar className="w-5 h-5 text-blue-500" />
      case 'Comparisons': return <Image className="w-5 h-5 text-purple-500" />
      default: return <File className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-[#FDFDFD] text-slate-900">
      <Breadcrumbs items={[{ label: 'Treatments' }]} />

      {!selectedTreatment ? (
        // Level 1: Treatment List
        <div className="space-y-4">
          {mockTreatments.map((treatment) => (
            <motion.div
              key={treatment.id}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => { setSelectedTreatment(treatment); setActiveTab('Reports') }}
            >
              <Card className="p-4 flex justify-between items-center border-2 border-slate-100 hover:border-emerald-500 transition-all">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{treatment.name}</h3>
                  <p className="text-sm text-gray-500">
                    {treatment.dermatologist} • Last updated {formatDate(treatment.lastUpdated)}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        // Level 2: Selected Treatment Details
        <div>
          <Button variant="outline" className="mb-4" onClick={() => setSelectedTreatment(null)}>
            Back to Treatments
          </Button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTreatment.name}</h2>
          <p className="text-gray-600 mb-6">Dermatologist: {selectedTreatment.dermatologist}</p>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`py-2 px-4 font-medium ${activeTab === tab ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'Reports' && selectedTreatment.reports.map((r) => (
              <Card key={r.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center shadow hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  {getIcon('Reports')}
                  <p className="font-semibold">{r.title}</p>
                </div>
                <div className="text-sm text-gray-500">{r.uploader} • {formatDate(r.date)}</div>
                <p className="mt-2 md:mt-0 text-gray-700">{r.description}</p>
              </Card>
            ))}

            {activeTab === 'Notes' && selectedTreatment.notes.map((n) => (
              <Card key={n.id} className="p-4 shadow hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-1">
                  {getIcon('Notes')}
                  <p className="text-sm text-gray-500">{n.uploader} • {formatDate(n.date)}</p>
                </div>
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="text-gray-700">{n.description}</p>
              </Card>
            ))}

            {activeTab === 'Appointments' && selectedTreatment.appointments.map((a) => (
              <Card key={a.id} className="p-4 shadow hover:shadow-lg transition-all flex justify-between">
                <div>
                  <p className="font-medium">{a.description}</p>
                  <p className="text-sm text-gray-500">{a.patient} • {formatDate(a.date)}</p>
                </div>
                <Calendar className="w-6 h-6 text-blue-500" />
              </Card>
            ))}

            {activeTab === 'Comparisons' && selectedTreatment.comparisons.map((c) => (
              <Card key={c.id} className="p-4 shadow hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center gap-4">
                <div>
                  <p className="font-medium">{c.type === 'before' ? 'Before' : 'After'} Image</p>
                  <p className="text-sm text-gray-500">{c.uploader} • {formatDate(c.date)}</p>
                </div>
                <img src={c.image} alt="Comparison" className="w-32 h-32 object-cover rounded-lg border" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TreatmentDashboard
