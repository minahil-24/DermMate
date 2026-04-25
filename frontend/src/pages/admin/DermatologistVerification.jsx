import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CheckCircle, XCircle, Loader2, ExternalLink, ShieldCheck, Mail } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import { getCertPath, getCertId, getCertStatus } from '../../utils/certificates'

const DermatologistVerification = () => {
  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiUrl}/api/auth/admin/verification/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = response.data || []
      setDoctors(list)
    } catch (error) {
      addToast({ type: 'error', title: 'Fetch Failed', message: 'Could not load doctors' })
    } finally {
      setLoading(false)
    }
  }, [apiUrl, token, addToast])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const setCertStatus = async (doctorId, certId, status) => {
    try {
      const res = await axios.patch(
        `${apiUrl}/api/auth/admin/doctors/${doctorId}/certifications/${certId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({
        type: 'success',
        title: 'Updated',
        message: `Certificate marked as ${status}.`,
      })
      setDoctors((prev) =>
        prev.map((d) => (d._id === doctorId ? res.data.doctor : d))
      )
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Error occurred',
      })
    }
  }

  const badgeFor = (status) => {
    if (status === 'verified')
      return (
        <span className="text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border-emerald-200">
          Verified
        </span>
      )
    if (status === 'rejected')
      return (
        <span className="text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full bg-red-100 text-red-800 border-red-200">
          Declined
        </span>
      )
    return (
      <span className="text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border-amber-200 animate-pulse">
        Pending
      </span>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Breadcrumbs
        items={[
          { label: 'Admin Dashboard', path: '/dashboard/admin' },
          { label: 'Verification Requests' },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Verification</h1>
        <p className="text-gray-600 font-medium">
          Review each credential separately. Doctors are notified when you accept or decline a document.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500 w-12 h-12 mb-4" />
          <p className="text-gray-500 font-medium italic">Loading doctors...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {doctors.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200">
                  <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-lg font-bold text-gray-900">No certificates yet</p>
                  <p className="text-gray-500">When dermatologists upload credentials, they will appear here.</p>
                </Card>
              </motion.div>
            ) : (
              doctors.map((doc, index) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow border-none ring-1 ring-slate-100 p-6">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-4 text-sm">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 shrink-0 shadow-md">
                          {doc.profilePhoto ? (
                            <img
                              src={`${apiUrl}/${doc.profilePhoto.replace(/\\/g, '/')}`}
                              alt={doc.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={doc.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'}
                              alt="Doctor"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-black text-xl text-gray-900 leading-tight">{doc.name}</h3>
                          <p className="text-gray-500 font-semibold flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {doc.email}
                          </p>
                          <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {doc.specialty || 'Generalist'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Certificates
                        </p>
                        {(doc.certifications || []).map((cert, idx) => {
                          const path = getCertPath(cert)
                          const cid = getCertId(cert)
                          const st = getCertStatus(cert)
                          if (!cid) return null
                          return (
                            <div
                              key={cid}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-100"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <a
                                  href={`${apiUrl}/${path.replace(/\\/g, '/')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 font-bold text-xs bg-white p-2 rounded-lg border border-emerald-100 flex-1 min-w-0"
                                >
                                  <ExternalLink className="w-4 h-4 shrink-0" />
                                  <span className="truncate">Credential #{idx + 1}</span>
                                </a>
                                {badgeFor(st)}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {st === 'pending' && (
                                  <>
                                    <Button
                                      type="button"
                                      onClick={() => setCertStatus(doc._id, cid, 'verified')}
                                      className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
                                    >
                                      <CheckCircle className="w-4 h-4" /> Accept
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setCertStatus(doc._id, cid, 'rejected')}
                                      className="h-10 border-2 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-black uppercase tracking-widest text-[10px]"
                                    >
                                      <XCircle className="w-4 h-4" /> Decline
                                    </Button>
                                  </>
                                )}
                                {st === 'verified' && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCertStatus(doc._id, cid, 'rejected')}
                                    className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                  >
                                    Mark declined
                                  </Button>
                                )}
                                {st === 'rejected' && (
                                  <Button
                                    type="button"
                                    onClick={() => setCertStatus(doc._id, cid, 'verified')}
                                    className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                  >
                                    Accept
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
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
