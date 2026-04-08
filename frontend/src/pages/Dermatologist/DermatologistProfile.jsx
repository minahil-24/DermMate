import { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, MapPin, Save, Briefcase, Star, Camera, Loader2, CheckCircle, FileText } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import axios from 'axios'

const DermatologistProfile = () => {
    const { user, updateUser, token } = useAuthStore()
    const addToast = useToastStore((state) => state.addToast)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)
    const certInputRef = useRef(null)

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        specialty: user?.specialty || '',
        experience: user?.experience || '',
        clinicName: user?.clinicName || '',
        location: user?.location || '',
        city: user?.city || '',
        bio: user?.bio || '',
        consultationFee: user?.consultationFee || '',
        availability: user?.availability || '',
        gender: user?.gender || 'male',
    })

    const [profilePhoto, setProfilePhoto] = useState(null)
    const [certificate, setCertificate] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const res = await axios.get(`${apiUrl}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const userData = res.data
                updateUser(userData)
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    specialty: userData.specialty || '',
                    experience: userData.experience || '',
                    clinicName: userData.clinicName || '',
                    location: userData.location || '',
                    city: userData.city || '',
                    bio: userData.bio || '',
                    consultationFee: userData.consultationFee || '',
                    availability: userData.availability || '',
                    gender: userData.gender || 'male',
                })
                if (userData.profilePhoto) {
                    setPreviewUrl(`${apiUrl}/${userData.profilePhoto.replace(/\\/g, '/')}`)
                }
            } catch (err) {
                console.error("Error fetching profile:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [apiUrl, token, updateUser])

    const handleFileChange = (e, type) => {
        const file = e.target.files[0]
        if (file) {
            if (type === 'photo') {
                setProfilePhoto(file)
                setPreviewUrl(URL.createObjectURL(file))
            } else {
                setCertificate(file)
            }
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const data = new FormData()
            
            // Append all form fields
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key])
            })
            
            if (profilePhoto) data.append('profilePhoto', profilePhoto)
            if (certificate) data.append('certifications', certificate)

            const response = await axios.put(`${apiUrl}/api/auth/profile`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                updateUser(response.data.user)
                setIsEditing(false)
                addToast({ type: 'success', title: 'Profile Updated', message: 'Your professional profile has been updated' })
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || error.message || 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    const getPlaceholder = () => {
        return formData.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <Breadcrumbs items={[{ label: 'Profile' }]} />

            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    {user?.isDoctorVerified && (
                        <CheckCircle className="w-8 h-8 text-blue-500 fill-blue-50" title="Verified Professional" />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <Card className="bg-white shadow-lg overflow-hidden">
                    <div className="text-center py-8 bg-emerald-50/50">
                        <div className="relative w-32 h-32 mx-auto mb-4 group">
                            <img
                                src={previewUrl || getPlaceholder()}
                                alt="Profile"
                                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                            />
                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="text-white w-8 h-8" />
                                </button>
                            )}
                            <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'photo')} className="hidden" accept="image/*" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                        <p className="text-emerald-600 font-medium">{user?.specialty || 'Dermatologist'}</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail className="w-5 h-5" /> <span>{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone className="w-5 h-5" /> <span>{user?.phoneNumber || 'No phone set'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Star className="w-5 h-5" /> <span>{user?.experience || '0'} years experience</span>
                        </div>
                        
                        {!isEditing && (
                            <Button variant="outline" className="w-full mt-4" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Professional Details</h2>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                {isEditing ? (
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" />
                                ) : <p className="text-gray-900 py-2 border-b border-transparent">{user?.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Specialty</label>
                                {isEditing ? (
                                    <input type="text" value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full p-2 border rounded-lg" />
                                ) : <p className="text-gray-900 py-2 border-b border-transparent">{user?.specialty || 'N/A'}</p>}
                            </div>

                            <div className="space-y-2 text-sm">
                                <label className="font-semibold text-gray-700">Clinic Name</label>
                                {isEditing ? (
                                    <input type="text" value={formData.clinicName} onChange={(e) => setFormData({...formData, clinicName: e.target.value})} className="w-full p-2 border rounded-lg" />
                                ) : <p className="text-gray-900 py-2">{user?.clinicName || 'N/A'}</p>}
                            </div>

                            <div className="space-y-2 text-sm">
                                <label className="font-semibold text-gray-700">Location/Address</label>
                                {isEditing ? (
                                    <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full p-2 border rounded-lg" />
                                ) : <p className="text-gray-900 py-2">{user?.location || 'N/A'}</p>}
                            </div>

                            <div className="space-y-2 text-sm">
                                <label className="font-semibold text-gray-700">Consultation Fee (PKR)</label>
                                {isEditing ? (
                                    <input type="number" value={formData.consultationFee} onChange={(e) => setFormData({...formData, consultationFee: e.target.value})} className="w-full p-2 border rounded-lg" />
                                ) : <p className="text-gray-900 py-2">PKR {user?.consultationFee || 'Not Set'}</p>}
                            </div>

                            {/* Bio */}
                            <div className="md:col-span-2 space-y-2 text-sm">
                                <label className="font-semibold text-gray-700">Bio / Professional Summary</label>
                                {isEditing ? (
                                    <textarea rows={4} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Tell patients about your background..." />
                                ) : <p className="text-gray-900 py-2">{user?.bio || 'No bio provided.'}</p>}
                            </div>

                            {/* Certificate Upload */}
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="font-semibold text-gray-700">Medical Certifications</label>
                                    {user?.isPendingVerification ? (
                                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-amber-200 animate-pulse">Pending Admin Review</span>
                                    ) : user?.isDoctorVerified ? (
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald-200">Verified Expert</span>
                                    ) : (
                                        <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Unverified</span>
                                    )}
                                </div>
                                {user?.certifications && user.certifications.length > 0 ? (
                                    <div className="space-y-3 mt-4">
                                        {user.certifications.map((path, idx) => (
                                            <a 
                                                key={idx}
                                                href={`${apiUrl}/${path.replace(/\\/g, '/')}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-white p-3 rounded-xl border border-blue-100 shadow-sm transition-all"
                                            >
                                                <FileText className="w-4 h-4 shrink-0" />
                                                <span className="text-sm font-bold truncate flex-1">Certification #{idx + 1}</span>
                                                <span className="text-[10px] font-black uppercase text-blue-400">View Document</span>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-blue-600 mt-2 mb-4 italic font-medium">No medical degrees uploaded yet. High-trust profiles have 2+ verified documents.</p>
                                )}
                                
                                <div className="mt-6 pt-6 border-t border-blue-100/50">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full bg-white font-bold text-blue-700 border-blue-200"
                                        onClick={() => window.location.href = '/dermatologist/certification'}
                                    >
                                        Manage Certifications
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default DermatologistProfile
