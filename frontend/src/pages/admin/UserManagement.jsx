import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, CheckCircle, Mail, MapPin, Loader2, Search, Trash2, UserX, UserCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const UserManagement = () => {
    const { token } = useAuthStore()
    const addToast = useToastStore((state) => state.addToast)
    const [activeTab, setActiveTab] = useState('patients')
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [actionId, setActionId] = useState(null)

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${apiUrl}/api/auth/users`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setUsers(response.data)
        } catch {
            addToast({ type: 'error', title: 'Fetch Error', message: 'Failed to load users' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDeletePatient = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return

        try {
            setActionId(userId)
            await axios.delete(`${apiUrl}/api/auth/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            addToast({ type: 'success', title: 'Deleted', message: 'Patient removed successfully' })
            setUsers(users.filter((u) => u._id !== userId))
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Delete Failed',
                message: error.response?.data?.message || 'Error occurred',
            })
        } finally {
            setActionId(null)
        }
    }

    const handleDeactivate = async (userId) => {
        if (!window.confirm('Deactivate this dermatologist? They can still view appointments but cannot manage patients.')) return

        try {
            setActionId(userId)
            const res = await axios.patch(
                `${apiUrl}/api/auth/users/${userId}/deactivate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            addToast({ type: 'success', title: 'Deactivated', message: 'Dermatologist account deactivated' })
            setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.user : u)))
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Failed',
                message: error.response?.data?.message || 'Could not deactivate account',
            })
        } finally {
            setActionId(null)
        }
    }

    const handleReactivate = async (userId) => {
        try {
            setActionId(userId)
            const res = await axios.patch(
                `${apiUrl}/api/auth/users/${userId}/reactivate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            addToast({ type: 'success', title: 'Reactivated', message: 'Dermatologist account restored' })
            setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.user : u)))
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Failed',
                message: error.response?.data?.message || 'Could not reactivate account',
            })
        } finally {
            setActionId(null)
        }
    }

    const filteredUsers = users.filter(
        (u) =>
            u.role === (activeTab === 'patients' ? 'patient' : 'dermatologist') &&
            (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const getAvatar = (user) => {
        if (user.profilePhoto) return `${apiUrl}/${user.profilePhoto.replace(/\\/g, '/')}`
        return user.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <Breadcrumbs items={[{ label: 'User Management' }]} />
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600 font-medium">Manage patients and medical professionals on the platform.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-xl w-full md:w-64 focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
                <button
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'patients' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setActiveTab('patients')}
                >
                    Patients
                </button>
                <button
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'dermatologists' ? 'bg-white shadow-md text-emerald-700' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setActiveTab('dermatologists')}
                >
                    Doctors
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border">
                    <Loader2 className="animate-spin text-emerald-500 w-12 h-12 mb-4" />
                    <p className="text-gray-500 font-medium italic">Loading users...</p>
                </div>
            ) : (
                <Card className="rounded-3xl overflow-hidden shadow-xl border-none">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="text-left py-5 px-6">User Profile</th>
                                    <th className="text-left py-5 px-6">Contact Info</th>
                                    {activeTab === 'dermatologists' && <th className="text-left py-5 px-6">Status</th>}
                                    <th className="text-right py-5 px-6">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence mode="popLayout">
                                    {filteredUsers.map((user, index) => (
                                        <motion.tr
                                            key={user._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-emerald-50/30 transition-colors"
                                        >
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={getAvatar(user)}
                                                        alt={user.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shadow-emerald-200"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                            {user.name}
                                                            {user.role === 'dermatologist' &&
                                                                user.isDoctorVerified &&
                                                                !user.isDeactivated && (
                                                                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                                                )}
                                                        </div>
                                                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-tighter">
                                                            {user.role}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2 max-w-[200px] truncate">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {user.email}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2 max-w-[200px] truncate">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />{' '}
                                                        {user.location || user.city || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            {activeTab === 'dermatologists' && (
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.isDeactivated ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold ring-1 ring-red-200">
                                                                <UserX className="w-3 h-3" /> DEACTIVATED
                                                            </span>
                                                        ) : user.isDoctorVerified ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold ring-1 ring-emerald-300">
                                                                <CheckCircle className="w-3 h-3" /> VERIFIED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold ring-1 ring-amber-200">
                                                                <Loader2 className="w-3 h-3" /> PENDING
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="py-5 px-6 text-right">
                                                {activeTab === 'dermatologists' ? (
                                                    user.isDeactivated ? (
                                                        <button
                                                            onClick={() => handleReactivate(user._id)}
                                                            disabled={actionId === user._id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all text-sm font-semibold disabled:opacity-50"
                                                            title="Reactivate dermatologist"
                                                        >
                                                            {actionId === user._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <UserCheck className="w-4 h-4" />
                                                            )}
                                                            Reactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDeactivate(user._id)}
                                                            disabled={actionId === user._id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-all text-sm font-semibold disabled:opacity-50"
                                                            title="Deactivate dermatologist"
                                                        >
                                                            {actionId === user._id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <UserX className="w-4 h-4" />
                                                            )}
                                                            Deactivate
                                                        </button>
                                                    )
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeletePatient(user._id)}
                                                        disabled={actionId === user._id}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                                        title="Delete patient"
                                                    >
                                                        {actionId === user._id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="p-12 text-center text-gray-500 font-medium italic">
                                No {activeTab} matching your search found.
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}

export default UserManagement
