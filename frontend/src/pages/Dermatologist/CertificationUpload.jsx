import { useState, useEffect } from 'react'
import { Upload, FileText, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { CERTIFICATION_STATUS } from '../../utils/constants'
import axios from 'axios'

const CertificationUpload = () => {
    const addToast = useToastStore((state) => state.addToast)
    const { user, token } = useAuthStore()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [certificates, setCertificates] = useState([])

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${apiUrl}/api/dermatologists/search?name=${user.name}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const foundProfile = response.data.find(p => p.userId._id === user.id || p.userId === user.id)
                if (foundProfile) {
                    setProfile(foundProfile)
                    if (foundProfile.certifications) {
                        setCertificates(foundProfile.certifications.map((path, index) => ({
                            id: index,
                            name: path.split(/[\\/]/).pop(),
                            path: path,
                            status: foundProfile.verified ? CERTIFICATION_STATUS.APPROVED : CERTIFICATION_STATUS.PENDING
                        })))
                    }
                }
            } catch (error) {
                console.error("Error fetching profile for certifications:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [user, token, apiUrl])

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !profile) return

        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('certifications', file)

            const response = await axios.put(`${apiUrl}/api/dermatologists/${profile._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                const updatedProfile = response.data
                setProfile(updatedProfile)
                setCertificates(updatedProfile.certifications.map((path, index) => ({
                    id: index,
                    name: path.split(/[\\/]/).pop(),
                    path: path,
                    status: updatedProfile.verified ? CERTIFICATION_STATUS.APPROVED : CERTIFICATION_STATUS.PENDING
                })))

                addToast({
                    type: 'success',
                    title: 'Uploaded',
                    message: 'Certificate uploaded and sent for verification',
                })
            }
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Upload Failed',
                message: error.response?.data?.message || error.message,
            })
        } finally {
            setUploading(false)
        }
    }

    const removeCertificate = async (path) => {
        try {
            const updatedPaths = profile.certifications.filter(p => p !== path)
            const response = await axios.put(`${apiUrl}/api/dermatologists/${profile._id}`, {
                certifications: updatedPaths
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.status === 200) {
                setProfile(response.data)
                setCertificates(response.data.certifications.map((p, index) => ({
                    id: index,
                    name: p.split(/[\\/]/).pop(),
                    path: p,
                    status: response.data.verified ? CERTIFICATION_STATUS.APPROVED : CERTIFICATION_STATUS.PENDING
                })))
                addToast({ type: 'success', title: 'Removed', message: 'Certificate removed' })
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to remove certificate' })
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case CERTIFICATION_STATUS.APPROVED:
                return 'bg-emerald-100 text-emerald-700'
            case CERTIFICATION_STATUS.PENDING:
                return 'bg-yellow-100 text-yellow-700'
            case CERTIFICATION_STATUS.REJECTED:
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Breadcrumbs items={[{ label: 'Certifications' }]} />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certifications</h1>
                <p className="text-gray-600">Upload and manage your medical licenses and degrees</p>
            </div>

            <Card>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
                    </div>
                ) : (
                    <>
                        {/* Uploaded Certificates */}
                        <div className="space-y-4 mb-8">
                            {certificates.map((cert) => (
                                <div
                                    key={cert.id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border hover:shadow-sm transition"
                                >
                                    <FileText className="w-10 h-10 text-emerald-600" />

                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{cert.name}</p>
                                        <a
                                            href={`${apiUrl}/${cert.path.replace(/\\/g, '/')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-emerald-600 hover:underline"
                                        >
                                            View Document
                                        </a>
                                    </div>

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                                            cert.status
                                        )}`}
                                    >
                                        {cert.status}
                                    </span>

                                    <button
                                        onClick={() => removeCertificate(cert.path)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Upload More */}
                        <label className="block">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                                {uploading ? (
                                    <Loader2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
                                ) : (
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                )}
                                <p className="text-sm text-gray-600 mb-1">
                                    {uploading ? 'Uploading...' : 'Click to upload another certificate'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    PDF, JPG, PNG (Max 5MB)
                                </p>
                            </div>
                        </label>
                    </>
                )}
            </Card>
        </div>
    )
}

export default CertificationUpload
