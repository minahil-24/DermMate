import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import { getCertPath, getCertId, getCertStatus } from '../../utils/certificates'

const statusBadge = (status) => {
  if (status === 'verified') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
        Verified
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700">
        Declined
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 animate-pulse">
      Pending review
    </span>
  )
}

const CertificationUpload = () => {
  const addToast = useToastStore((state) => state.addToast)
  const { user, token, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const fetchLatestProfile = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      updateUser(response.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, token, updateUser])

  useEffect(() => {
    fetchLatestProfile()
  }, [fetchLatestProfile])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('certifications', file)

      const response = await axios.post(`${apiUrl}/api/auth/profile/files`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 200) {
        updateUser(response.data.user)
        addToast({
          type: 'success',
          title: 'Uploaded',
          message: 'Certification added successfully',
        })
      }
    } catch (error) {
      const isNetwork = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: isNetwork
          ? 'Cannot reach the server. Confirm the backend is running and REACT_APP_API_URL matches it (e.g. same host/port as this page).'
          : error.response?.data?.message || error.message,
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeCertificate = async (cert) => {
    const id = getCertId(cert)
    if (!id) {
      addToast({ type: 'error', title: 'Error', message: 'Cannot remove this certificate (refresh the page).' })
      return
    }
    if (
      !window.confirm(
        'Are you sure you want to remove this certificate? It will be deleted from the server.'
      )
    )
      return

    try {
      const response = await axios.delete(
        `${apiUrl}/api/auth/certifications/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.status === 200) {
        updateUser(response.data.user)
        addToast({ type: 'success', title: 'Removed', message: 'Certificate deleted from server' })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to remove certificate',
      })
    }
  }

  const certs = user?.certifications || []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard/dermatologist' },
          { label: 'My Certifications' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">My Certifications</h1>
        <p className="text-gray-600 font-medium italic">
          Upload and manage your medical licenses and degrees to build trust with patients.
        </p>
      </div>

      <Card className="p-8 border-none ring-1 ring-slate-100 shadow-xl rounded-3xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-500 w-12 h-12 mb-4" />
            <p className="text-gray-500 font-medium italic">Loading your credentials...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {certs.length > 0 ? (
                certs.map((cert, index) => {
                  const path = getCertPath(cert)
                  const cid = getCertId(cert)
                  const st = getCertStatus(cert)
                  return (
                    <div
                      key={cid || `cert-${index}`}
                      className="flex items-center gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 hover:shadow-md transition group"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">Certification #{index + 1}</p>
                        <a
                          href={`${apiUrl}/${path.replace(/\\/g, '/')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 font-bold hover:underline"
                        >
                          View Document
                        </a>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {statusBadge(st)}
                        <button
                          type="button"
                          onClick={() => removeCertificate(cert)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete permanently"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="md:col-span-2 py-10 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed">
                  No certifications uploaded yet.
                </div>
              )}
            </div>

            <label className="block w-full">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/10 rounded-3xl p-10 text-center hover:border-emerald-400 hover:bg-emerald-50/20 transition-all cursor-pointer group">
                {uploading ? (
                  <Loader2 className="w-14 h-14 text-emerald-500 mx-auto mb-4 animate-spin" />
                ) : (
                  <Upload className="w-14 h-14 text-emerald-300 group-hover:text-emerald-500 mx-auto mb-4 transition-colors" />
                )}
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {uploading ? 'Finalizing Upload...' : 'Add New Certificate'}
                </p>
                <p className="text-sm text-gray-500 font-medium italic">
                  {uploading ? 'Storing on secure server...' : 'PDF, JPG, or PNG (Max 5MB)'}
                </p>
              </div>
            </label>
          </>
        )}
      </Card>

      <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
        <CheckCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-blue-900">Verification Process</h3>
          <p className="text-sm text-blue-700 font-medium">
            Each document is reviewed separately. You will be notified when a certificate is accepted or
            declined.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CertificationUpload
