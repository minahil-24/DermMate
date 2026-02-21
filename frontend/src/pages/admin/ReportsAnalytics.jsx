import { motion } from 'framer-motion'
import { BarChart, PieChart } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const ReportsAnalytics = () => {
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Appointments',
      data: [120, 190, 300, 500, 200, 300],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
    }],
  }

  const pieData = {
    labels: ['Patients', 'Dermatologists', 'Admins'],
    datasets: [{
      data: [1000, 45, 5],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(234, 179, 8, 0.8)'],
    }],
  }

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
