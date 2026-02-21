import { useState } from 'react'
import { User, Mail, Phone, MapPin, Save, Briefcase, Star } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const DermatologistProfile = () => {
  const { user, updateUser, token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    specialty: user?.specialty || '',
    experience: user?.experience || '',
    clinicName: user?.clinicName || '',
    location: user?.location || '',
    gender: user?.gender || 'male',
  })

  const handleSave = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullUrl = `${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}/api/auth/profile`;

      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data.user);
        setIsEditing(false)
        addToast({ type: 'success', title: 'Profile Updated', message: 'Your profile has been updated' })
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Update Failed', message: error.message || 'Failed to update profile' })
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Profile' }]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your professional profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="text-center py-6">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                alt="Avatar"
                className="w-32 h-32 rounded-full border-4 border-emerald-500 shadow-md"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">{formData.name}</h2>
            <p className="text-gray-600 mb-4">{formData.specialty}</p>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="px-6"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* Quick Info */}
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 px-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>{formData.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>{formData.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{formData.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <span>{formData.clinicName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Star className="w-4 h-4 text-emerald-500" />
              <span>{formData.experience} years experience</span>
            </div>
          </div>
        </Card>

        {/* Professional Info Card */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />Save
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 capitalize">{key === 'phoneNumber' ? 'Phone Number' : key === 'clinicName' ? 'Clinic Name' : key}</label>
                  {isEditing ? (
                    key === 'gender' ? (
                      <select
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    ) : (
                      <input
                        type={key === 'email' ? 'email' : key === 'experience' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    )
                  ) : (
                    <p className="text-gray-900 capitalize">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DermatologistProfile
