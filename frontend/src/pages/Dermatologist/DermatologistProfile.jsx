import { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, MapPin, Save, Briefcase, Star, Camera, Loader2 } from 'lucide-react'
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
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profileId, setProfileId] = useState(null)
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phoneNumber || '',
        specialty: user?.specialty || '',
        yearsOfExperience: user?.experience || '',
        clinicName: user?.clinicName || '',
        clinicAddress: user?.location || '',
        city: '',
        bio: '',
        consultationFee: '',
        availability: '',
    })
    const [profilePhoto, setProfilePhoto] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${apiUrl}/api/dermatologists/search?name=${user.name}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                // Find the profile belonging to this user
                const profile = response.data.find(p => p.userId._id === user.id || p.userId === user.id)

                if (profile) {
                    setProfileId(profile._id)
                    setFormData({
                        fullName: profile.fullName,
                        email: user?.email || '',
                        phone: profile.phone,
                        specialty: profile.specialty,
                        yearsOfExperience: profile.yearsOfExperience,
                        clinicName: profile.clinicName,
                        clinicAddress: profile.clinicAddress,
                        city: profile.city,
                        bio: profile.bio,
                        consultationFee: profile.consultationFee,
                        availability: profile.availability,
                    })
                    if (profile.profilePhoto) {
                        setPreviewUrl(`${apiUrl}/${profile.profilePhoto.replace(/\\/g, '/')}`)
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [user, token, apiUrl])

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setProfilePhoto(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const data = new FormData()
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key])
            })
            if (!profileId) {
                data.append('userId', user.id)
            }
            if (profilePhoto) {
                data.append('profilePhoto', profilePhoto)
            }

            let response;
            if (profileId) {
                response = await axios.put(`${apiUrl}/api/dermatologists/${profileId}`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                })
            } else {
                response = await axios.post(`${apiUrl}/api/dermatologists/profile`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                })
            }

            if (response.status === 200 || response.status === 201) {
                setProfileId(response.data._id)
                setIsEditing(false)
                addToast({ type: 'success', title: 'Profile Updated', message: 'Your professional profile has been updated' })
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || error.message || 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <Breadcrumbs items={[{ label: 'Profile' }]} />

            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
                    <p className="text-gray-600">Manage your professional profile</p>
                </div>
                {loading && <Loader2 className="animate-spin text-emerald-500 w-6 h-6" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Summary Card */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="text-center py-6">
                        <div className="relative w-32 h-32 mx-auto mb-4 group">
                            <img
                                src={previewUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"}
                                alt="Avatar"
                                className="w-32 h-32 rounded-full border-4 border-emerald-500 shadow-md object-cover"
                            />
                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="text-white w-8 h-8" />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-1">{formData.fullName}</h2>
                        <p className="text-gray-600 mb-4">{formData.specialty}</p>
                        {!isEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 px-6">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4 text-emerald-500" />
                            <span>{formData.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="w-4 h-4 text-emerald-500" />
                            <span>{formData.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span>{formData.clinicAddress}, {formData.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Briefcase className="w-4 h-4 text-emerald-500" />
                            <span>{formData.clinicName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Star className="w-4 h-4 text-emerald-500" />
                            <span>{formData.yearsOfExperience} years experience</span>
                        </div>
                    </div>
                </Card>

                {/* Right Column - Detail/Edit Form */}
                <div className="lg:col-span-2">
                    <Card className="bg-white shadow-lg h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(formData).map(([key, value]) => {
                                if (key === 'email') return (
                                    <div key={key} className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 capitalize">Email</label>
                                        <p className="text-gray-900">{value}</p>
                                    </div>
                                );

                                return (
                                    <div key={key} className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type={key === 'yearsOfExperience' || key === 'consultationFee' ? 'number' : 'text'}
                                                value={value}
                                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{value || 'N/A'}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default DermatologistProfile
