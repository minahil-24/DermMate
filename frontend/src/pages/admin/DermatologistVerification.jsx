import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CheckCircle, XCircle, Loader2, ExternalLink, ShieldCheck, Mail } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const DermatologistVerification = () => {
  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiUrl}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filter for dermatologists who have pending verification reviews
      const pending = response.data.filter(u => u.role === 'dermatologist' && u.isPendingVerification)
      setDoctors(pending)
    } catch (error) {
      addToast({ type: 'error', title: 'Fetch Failed', message: 'Could not load pending verifications' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingDoctors()
  }, [])

  const handleApprove = async (id) => {
    try {
      await axios.patch(`${apiUrl}/api/auth/verify-doctor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      addToast({ type: 'success', title: 'Approved', message: 'Dermatologist has been verified' })
      setDoctors(doctors.filter(d => d._id !== id))
    } catch (error) {
      addToast({ type: 'error', title: 'Approval Failed', message: error.response?.data?.message || 'Error occurred' })
    }
  }

  const handleReject = (id) => {
    addToast({ type: 'info', title: 'Action Required', message: 'Rejection requires a manual profile update or deletion for now.' })
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Breadcrumbs items={[{ label: 'Admin Dashboard', path: '/dashboard/admin' }, { label: 'Verification Requests' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Verification</h1>
        <p className="text-gray-600 font-medium">Verify credentials for medical professionals to grant them a trusted badge.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500 w-12 h-12 mb-4" />
          <p className="text-gray-500 font-medium italic">Scanning for new submissions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {doctors.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200">
                    <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-lg font-bold text-gray-900">All caught up!</p>
                    <p className="text-gray-500">No pending verification requests at the moment.</p>
                </Card>
              </motion.div>
            ) : (
              doctors.map((doc, index) => (
                <motion.div 
                  key={doc._id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-none ring-1 ring-slate-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4 text-sm">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                          <FileText className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-black text-xl text-gray-900 leading-tight">{doc.name}</h3>
                          <p className="text-gray-500 font-semibold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {doc.email}</p>
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">{doc.specialty || 'Generalist'}</span>
                            <span className="text-gray-300">•</span>
                          <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 inline-block mb-2">{doc.specialty || 'Generalist'}</span>
                            
                            {doc.certifications && doc.certifications.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2">
                                {doc.certifications.map((path, idx) => (
                                  <a 
                                    key={idx}
                                    href={`${apiUrl}/${path.replace(/\\/g, '/')}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 font-bold text-xs bg-emerald-50/50 p-2 rounded-lg"
                                  >
                                    <ExternalLink className="w-4 h-4" /> View Credential #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-amber-600 font-bold italic">No certification documents uploaded.</p>
                            )}
                          </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={() => handleApprove(doc._id)}
                          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 h-12 px-6 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve Expert
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleReject(doc._id)}
                          className="h-12 border-2 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-black uppercase tracking-widest text-[10px]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default DermatologistVerification
