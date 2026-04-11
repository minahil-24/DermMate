import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Camera, Save, Edit, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import axios from 'axios'
import HelpModal from '../../components/common/HelpModal'

const PatientProfile = () => {
    const { user, updateUser, token } = useAuthStore()
    const addToast = useToastStore((state) => state.addToast)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        location: user?.location || '',
        age: user?.age || '',
        gender: user?.gender || 'male',
    })

    const [profilePhoto, setProfilePhoto] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    useEffect(() => {
        if (user?.profilePhoto) {
            setPreviewUrl(`${apiUrl}/${user.profilePhoto.replace(/\\/g, '/')}`)
        }
    }, [user, apiUrl])

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
            const patchBody = {
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                location: formData.location,
                age: formData.age,
                gender: formData.gender,
            }

            const response = await axios.patch(`${apiUrl}/api/auth/profile`, patchBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            let latestUser = response.data.user
            updateUser(latestUser)

            if (profilePhoto) {
                const fd = new FormData()
                fd.append('profilePhoto', profilePhoto)
                const fileRes = await axios.post(`${apiUrl}/api/auth/profile/files`, fd, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                latestUser = fileRes.data.user
                updateUser(latestUser)
            }

            setIsEditing(false)
            setProfilePhoto(null)
            addToast({
                type: 'success',
                title: 'Profile Updated',
                message: 'Your profile has been updated successfully',
            })
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: error.response?.data?.message || error.message || 'Failed to update profile',
            })
        } finally {
            setSaving(false)
        }
    }

    const getPlaceholder = () => {
        return formData.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6 md:p-12">
            <Breadcrumbs items={[{ label: 'Profile' }]} />

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Profile Settings</h1>
                <p className="text-gray-600 text-lg">Manage your personal information and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Avatar Card */}
                <Card className="relative p-8 flex flex-col items-center bg-white shadow-lg rounded-3xl h-fit">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative mb-4"
                    >
                        <img
                            src={previewUrl || getPlaceholder()}
                            alt="Avatar"
                            className="w-40 h-40 rounded-full border-4 border-emerald-100 shadow-md object-cover bg-gray-50"
                        />
                        {isEditing && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 bg-emerald-600 p-3 rounded-full hover:bg-emerald-700 cursor-pointer shadow-lg"
                            >
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{formData.name}</h2>
                    <p className="text-emerald-600 mb-6 font-semibold uppercase tracking-wide text-sm">Patient</p>
                    {!isEditing && (
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Edit className="w-4 h-4" /> Edit Profile
                        </Button>
                    )}
                </Card>

                {/* Info Card */}
                <Card className="p-8 bg-white shadow-lg rounded-3xl lg:col-span-2">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b">
                        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                        {isEditing && (
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <div className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</div>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-600" /> Full Name
                            </label>
                            {isEditing ? (
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-xl" />
                            ) : <p className="text-gray-900 font-medium p-1">{formData.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-600" /> Email
                            </label>
                            <p className="text-gray-500 font-medium p-1">{formData.email}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-purple-600" /> Phone Number
                            </label>
                            {isEditing ? (
                                <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full p-3 border rounded-xl" />
                            ) : <p className="text-gray-900 font-medium p-1">{formData.phoneNumber || 'Not set'}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-rose-600" /> Location
                            </label>
                            {isEditing ? (
                                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-3 border rounded-xl" />
                            ) : <p className="text-gray-900 font-medium p-1">{formData.location || 'Not set'}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Age</label>
                            {isEditing ? (
                                <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="w-full p-3 border rounded-xl" />
                            ) : <p className="text-gray-900 font-medium p-1">{formData.age ? `${formData.age} years` : 'Not set'}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Gender</label>
                            {isEditing ? (
                                <select 
                                    value={formData.gender} 
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })} 
                                    className="w-full p-3 border rounded-xl"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            ) : <p className="text-gray-900 font-medium p-1 capitalize">{formData.gender}</p>}
                        </div>
                    </div>
                </Card>
            </div>
            <HelpModal />
        </div>
    )
}

export default PatientProfile
