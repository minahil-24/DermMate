import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, User, Loader2, CreditCard } from 'lucide-react'
import axios from 'axios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { formatDate } from '../../utils/helpers'

const PatientCases = () => {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${apiUrl}/api/cases/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCases(res.data || [])
      } catch {
        setCases([])
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token, apiUrl])

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

  const payLabel = (c) => {
    if (c.paymentStatus === 'paid') return 'Paid'
    if (c.paymentMethod === 'cod' || c.paymentMethod === 'cash') return 'COD / at clinic'
    return c.paymentStatus || '—'
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-slate-900 font-sans">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'My Cases' }]} />

      <div className="mt-8 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Cases</h1>
          <p className="text-slate-500 mt-1">Pre-appointment submissions and consultation history.</p>
        </div>
        <Button onClick={() => navigate('/patient/dermatologists')} variant="outline">
          Book with a specialist
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
      ) : cases.length === 0 ? (
        <Card className="text-center py-16 rounded-[2rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-600 mb-4">No cases yet. Complete a booking flow to see your case here.</p>
          <Button onClick={() => navigate('/patient/dermatologists')}>Find a dermatologist</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {cases.map((caseItem, index) => (
            <motion.div
              key={caseItem._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group relative bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                    {caseItem._id?.slice(-8)}
                  </span>
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      caseItem.caseStatus === 'submitted'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {caseItem.caseStatus || 'Submitted'}
                  </span>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {cap(caseItem.complaintType)}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Pre-appointment package</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <User size={14} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                        Dermatologist
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {caseItem.doctor?.name || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                      <Calendar size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                        Requested visit
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {caseItem.appointmentDate ? formatDate(caseItem.appointmentDate) : '—'} ·{' '}
                        {caseItem.appointmentTimeSlot || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <CreditCard size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                        Payment
                      </p>
                      <p className="text-sm font-semibold text-slate-700">{payLabel(caseItem)}</p>
                    </div>
                  </div>
                </div>

              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientCases
