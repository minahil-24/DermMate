import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Stethoscope, Award, FileText, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const AdminDashboard = () => {
    const { token } = useAuthStore()
    const [statsData, setStatsData] = useState(null)
    const [loading, setLoading] = useState(true)

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/auth/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                setStatsData(res.data)
            } catch (err) {
                console.error("Error fetching stats:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [token, apiUrl])

    const stats = [
        { label: 'Total Users', value: statsData?.totalUsers || '0', icon: Users, color: 'bg-emerald-500' },
        { label: 'Specialists', value: statsData?.totalDoctors || '0', icon: Stethoscope, color: 'bg-blue-500' },
        { label: 'Verified Experts', value: statsData?.verifiedDoctors || '0', icon: Award, color: 'bg-teal-500' },
        { label: 'Patients', value: statsData?.totalPatients || '0', icon: Users, color: 'bg-yellow-500' },
    ]

    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'User Growth',
            data: [100, 200, 300, 400, 500, (statsData?.totalUsers || 600)],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
        }],
    }

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
        </div>
    )

    return (
        <div className="p-4 md:p-8">
            <Breadcrumbs items={[{ label: 'Admin Dashboard' }]} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Overview</h1>
                <p className="text-gray-600 font-medium">Real-time statistics for users, doctors, and verification status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card className="hover:shadow-2xl transition-all duration-300 border-none ring-1 ring-slate-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className={`${stat.color} p-4 rounded-2xl shadow-lg`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 gap-8">
                <Card className="p-8 border-none ring-1 ring-slate-100 shadow-xl rounded-3xl">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement & Growth</h2>
                    <div className="h-96">
                        <Line data={chartData} options={{ 
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: { beginAtZero: true }
                            }
                        }} />
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default AdminDashboard
