import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Camera, Save, Edit } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const PatientProfile = () => {
  const { user, updateUser, token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    location: user?.location || '',
    age: user?.age || '',
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
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully',
        })
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6 md:p-12">
      <Breadcrumbs items={[{ label: 'Profile' }]} />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600 text-lg">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Card */}
        <Card className="relative p-8 flex flex-col items-center bg-gradient-to-b from-emerald-100 to-emerald-50 shadow-lg rounded-3xl hover:shadow-2xl transition-shadow duration-300">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative mb-4"
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`}
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-white shadow-md"
            />
            {isEditing && (
              <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full hover:bg-emerald-700 cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{formData.name}</h2>
          <p className="text-gray-700 mb-4 font-medium">Patient</p>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="uppercase tracking-wider font-semibold px-6"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          )}
        </Card>

        {/* Personal Info Card */}
        <Card className="p-8 bg-white shadow-lg rounded-3xl hover:shadow-2xl transition-shadow duration-300 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            {isEditing && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Full Name', icon: <User className="w-4 h-4 text-emerald-600" />, key: 'name', type: 'text' },
              { label: 'Email', icon: <Mail className="w-4 h-4 text-blue-600" />, key: 'email', type: 'email' },
              { label: 'Phone', icon: <Phone className="w-4 h-4 text-purple-600" />, key: 'phoneNumber', type: 'tel' },
              { label: 'Location', icon: <MapPin className="w-4 h-4 text-rose-600" />, key: 'location', type: 'text' },
              { label: 'Age', icon: null, key: 'age', type: 'number' },
              { label: 'Gender', icon: null, key: 'gender', type: 'select', options: ['male', 'female', 'other'] },
            ].map((field) => (
              <div key={field.key} className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  {field.icon}
                  {field.label}
                </label>
                {isEditing ? (
                  field.type === 'select' ? (
                    <select
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  )
                ) : (
                  <p className="text-gray-900 font-medium">
                    {field.key === 'age' ? `${formData.age} years` : formData[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PatientProfile
