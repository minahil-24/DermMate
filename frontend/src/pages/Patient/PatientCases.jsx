import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, User, Star } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const softMockCases = [
  {
    id: 'CAS-001',
    complaintType: 'Hair Loss',
    complaintSubtype: 'Thinning Crown',
    status: 'Active',
    dermatologist: 'Dr. Sarah Johnson',
    createdAt: '2026-01-05',
  },
  {
    id: 'CAS-002',
    complaintType: 'Skin Texture',
    complaintSubtype: 'Acne Scars',
    status: 'Completed',
    dermatologist: 'Dr. Michael Chen',
    createdAt: '2025-12-15',
  },
  {
    id: 'CAS-003',
    complaintType: 'Scalp Health',
    complaintSubtype: 'Seborrheic Dermatitis',
    status: 'Active',
    dermatologist: 'Dr. Emily White',
    createdAt: '2026-01-10',
  }
]

const PatientCases = () => {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState({}) // store caseId: rating
  const [activeReview, setActiveReview] = useState(null) // currently open review

  const handleStarClick = (caseId, rating) => {
    setReviews({ ...reviews, [caseId]: rating })
  }

  const handleSubmitReview = (caseId) => {
    alert(`You rated ${reviews[caseId]} stars for ${caseId}`)
    setActiveReview(null) // close review popup
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-slate-900 font-sans">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'My Cases' }]} />

      <div className="mt-8 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Cases</h1>
          <p className="text-slate-500 mt-1">Manage your dermatological history and AI reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {softMockCases.map((caseItem, index) => (
          <motion.div
            key={caseItem.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100">
              
              {/* Header: ID & Status */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">{caseItem.id}</span>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  caseItem.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {caseItem.status}
                </span>
              </div>

              {/* Title Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {caseItem.complaintType}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{caseItem.complaintSubtype}</p>
              </div>

              {/* Info Rows */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <User size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Assigned Provider</p>
                    <p className="text-sm font-semibold text-slate-700">{caseItem.dermatologist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <Calendar size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Consultation Date</p>
                    <p className="text-sm font-semibold text-slate-700">{caseItem.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* Completed Case: Show Review Button */}
              {caseItem.status === 'Completed' && (
                <div>
                  {activeReview === caseItem.id ? (
                    <div className="flex flex-col items-start gap-4">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className={`cursor-pointer ${reviews[caseItem.id] >= star ? 'text-amber-400' : 'text-slate-300'}`}
                            onClick={() => handleStarClick(caseItem.id, star)}
                          />
                        ))}
                      </div>
                      <Button onClick={() => handleSubmitReview(caseItem.id)} className="mt-2 bg-emerald-600 text-white hover:bg-emerald-700">
                        Submit Review
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setActiveReview(caseItem.id)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                      Give Review
                    </Button>
                  )}
                </div>
              )}

              {/* Display current review if already given */}
              {reviews[caseItem.id] && activeReview !== caseItem.id && (
                <div className="flex items-center gap-1 mt-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={reviews[caseItem.id] >= star ? 'text-amber-400' : 'text-slate-300'}
                    />
                  ))}
                  <span className="text-sm text-slate-500 ml-2">{reviews[caseItem.id]}.0 Review</span>
                </div>
              )}

            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PatientCases
