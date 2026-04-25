import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, PieChart, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const ReportsAnalytics = () => {
  const { token } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [token, apiUrl])

  const barData = {
    labels: data?.appointmentsOverTime?.map(a => a.label) || [],
    datasets: [{
      label: 'Appointments',
      data: data?.appointmentsOverTime?.map(a => a.count) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
    }],
  }

  const pieData = {
    labels: ['Patients', 'Dermatologists', 'Admins'],
    datasets: [{
      data: [
        data?.userDistribution?.patients || 0,
        data?.userDistribution?.doctors || 0,
        data?.userDistribution?.admins || 0
      ],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(234, 179, 8, 0.8)'],
    }],
  }

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
    </div>
  )

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Reports & Analytics' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">System usage statistics and insights</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <BarChart className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Appointments Over Time</h2>
          </div>
          <Bar data={barData} options={{ responsive: true }} />
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">User Distribution</h2>
          </div>
          <Pie data={pieData} options={{ responsive: true }} />
        </Card>
      </div>
    </div>
  )
}

export default ReportsAnalytics
