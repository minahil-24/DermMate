import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Percent, Wallet, Users, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const SystemRevenue = () => {
    const { token } = useAuthStore()
    const addToast = useToastStore((s) => s.addToast)
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    const [loading, setLoading] = useState(true)
    const [doctors, setDoctors] = useState([])
    const [settingDeadlineFor, setSettingDeadlineFor] = useState(null)
    const [deadlineDate, setDeadlineDate] = useState('')

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${apiUrl}/api/billing/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setDoctors(res.data.data)
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to fetch revenue data.' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchData()
    }, [token])

    const handleSetDeadline = async (id) => {
        if (!deadlineDate) return addToast({ type: 'error', title: 'Date Required', message: 'Please select a date' })

        try {
            await axios.post(`${apiUrl}/api/billing/admin/set-deadline`, {
                dermatologistId: id,
                deadline: deadlineDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            addToast({ type: 'success', title: 'Deadline Set', message: 'Payment deadline updated successfully' })
            setSettingDeadlineFor(null)
            setDeadlineDate('')
            fetchData()
        } catch (error) {
            addToast({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || 'Failed to set deadline' })
        }
    }

    // Calculations
    const totalPayments = doctors.reduce((s, p) => s + p.totalCharges, 0)
    const systemRevenue = doctors.reduce((s, p) => s + p.systemCut, 0)
    const dermatologistRevenue = totalPayments - systemRevenue

    const stats = [
        { label: 'Total Volume', value: `PKR ${totalPayments.toLocaleString()}`, icon: Wallet, gradient: 'from-emerald-500 to-green-400' },
        { label: 'System Cut (5%)', value: `PKR ${systemRevenue.toLocaleString()}`, icon: Percent, gradient: 'from-blue-500 to-cyan-400' },
        { label: 'Dermatologist Earnings', value: `PKR ${dermatologistRevenue.toLocaleString()}`, icon: Users, gradient: 'from-teal-500 to-emerald-400' },
        { label: 'Active Dermatologists', value: doctors.length, icon: TrendingUp, gradient: 'from-yellow-400 to-orange-400' },
    ]

    return (
        <div className="space-y-10">
            <Breadcrumbs items={[{ label: 'Admin' }, { label: 'System Revenue' }]} />

            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Revenue & Billing</h1>
                <p className="text-gray-600">Monitor 5% system deductions and enforce payment deadlines for dermatologists.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Card>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">{stat.label}</p>
                                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                            </div>
                                            <div className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-xl`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Dermatologist Table */}
                    <Card className="shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Dermatologist Billing Profiles</h2>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold text-gray-600">Dermatologist</th>
                                        <th className="px-5 py-4 font-semibold text-gray-600">Total Cases</th>
                                        <th className="px-5 py-4 font-semibold text-gray-600">Pending System Fee</th>
                                        <th className="px-5 py-4 font-semibold text-gray-600">Status</th>
                                        <th className="px-5 py-4 font-semibold text-gray-600 text-right">Payment Deadline</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-white">
                                    {doctors.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-500 italic">No dermatologists found.</td>
                                        </tr>
                                    ) : (
                                        doctors.map((p, index) => (
                                            <motion.tr
                                                key={p.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-blue-50/40 transition"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="font-semibold text-gray-800">{p.name}</div>
                                                    <div className="text-xs text-gray-500">{p.email}</div>
                                                </td>
                                                <td className="px-5 py-4 font-medium text-gray-700">{p.totalCases}</td>
                                                <td className="px-5 py-4">
                                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                                        PKR {p.systemCut.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {p.status === 'Blocked' ? (
                                                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">Blocked (Unpaid)</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Active</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {settingDeadlineFor === p.id ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input 
                                                                type="date" 
                                                                value={deadlineDate}
                                                                onChange={(e) => setDeadlineDate(e.target.value)}
                                                                className="border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500 text-xs"
                                                            />
                                                            <Button size="sm" onClick={() => handleSetDeadline(p.id)} className="bg-blue-600 hover:bg-blue-700 text-xs py-1 px-2 h-auto text-white">Save</Button>
                                                            <Button size="sm" variant="outline" onClick={() => setSettingDeadlineFor(null)} className="text-xs py-1 px-2 h-auto">Cancel</Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div>
                                                                {p.deadline ? <p className="font-semibold text-gray-800">{new Date(p.deadline).toLocaleDateString()}</p> : <p className="text-gray-400 italic">No deadline</p>}
                                                            </div>
                                                            <button 
                                                                onClick={() => setSettingDeadlineFor(p.id)}
                                                                className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors"
                                                            >
                                                                <Calendar className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    )
}

export default SystemRevenue
