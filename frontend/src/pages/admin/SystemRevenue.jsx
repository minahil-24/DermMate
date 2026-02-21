import { motion } from 'framer-motion'
import { Percent, Wallet, Users, TrendingUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

const SystemRevenue = () => {
    /* ================= MOCK PAYMENT DATA ================= */
    const payments = [
        { id: 1, patient: 'Ali Khan', dermatologist: 'Dr. Sara Malik', amount: 5000, month: 'Jan' },
        { id: 2, patient: 'Ayesha Noor', dermatologist: 'Dr. Ahmed Raza', amount: 3000, month: 'Feb' },
        { id: 3, patient: 'Hassan Ali', dermatologist: 'Dr. Sara Malik', amount: 7000, month: 'Mar' },
        { id: 4, patient: 'Fatima Zahid', dermatologist: 'Dr. Usman Iqbal', amount: 4000, month: 'Apr' },
        { id: 5, patient: 'Bilal Hussain', dermatologist: 'Dr. Ahmed Raza', amount: 6000, month: 'May' },
    ]

    /* ================= BUSINESS LOGIC ================= */
    const SYSTEM_PERCENT = 0.05
    const totalPayments = payments.reduce((s, p) => s + p.amount, 0)
    const systemRevenue = totalPayments * SYSTEM_PERCENT
    const dermatologistRevenue = totalPayments - systemRevenue
    const dermatologistCount = new Set(payments.map(p => p.dermatologist)).size

    /* ================= MONTHLY SYSTEM INCOME ================= */
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const monthlySystemIncome = months.map(month =>
        payments.filter(p => p.month === month).reduce((s, p) => s + p.amount * SYSTEM_PERCENT, 0)
    )

    /* ================= STATS ================= */
    const stats = [
        { label: 'Total Payments', value: `PKR ${totalPayments.toLocaleString()}`, icon: Wallet, gradient: 'from-emerald-500 to-green-400' },
        { label: 'System Cut (5%)', value: `PKR ${systemRevenue.toLocaleString()}`, icon: Percent, gradient: 'from-blue-500 to-cyan-400' },
        { label: 'Dermatologist Earnings', value: `PKR ${dermatologistRevenue.toLocaleString()}`, icon: Users, gradient: 'from-teal-500 to-emerald-400' },
        { label: 'Dermatologists', value: dermatologistCount, icon: TrendingUp, gradient: 'from-yellow-400 to-orange-400' },
    ]

    /* ================= CHART ================= */
    const chartData = {
        labels: months,
        datasets: [
            {
                label: 'System Income (5%)',
                data: monthlySystemIncome,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.2)',
                fill: true,
                tension: 0.45,
                pointRadius: 5,
                pointBackgroundColor: '#3b82f6',
            },
        ],
    }

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' } },
        },
    }

    return (
        <div className="space-y-10">
            <Breadcrumbs items={[{ label: 'Admin' }, { label: 'System Revenue' }]} />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Revenue</h1>
                <p className="text-gray-600">5% commission deducted from dermatologist payments</p>
            </div>

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

            {/* Chart */}
            <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">System Income Trend</h2>
                <Line data={chartData} options={chartOptions} />
            </Card>

            {/* ================= TRANSACTION TABLE ================= */}
            <Card className="shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                        {payments.length} Transactions
                    </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-5 py-4 text-left font-semibold text-gray-600">Patient</th>
                                <th className="px-5 py-4 text-left font-semibold text-gray-600">Dermatologist</th>
                                <th className="px-5 py-4 text-right font-semibold text-gray-600">Paid</th>
                                <th className="px-5 py-4 text-right font-semibold text-gray-600">System (5%)</th>
                                <th className="px-5 py-4 text-right font-semibold text-gray-600">Doctor Receives</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y bg-white">
                            {payments.map((p, index) => {
                                const systemCut = p.amount * SYSTEM_PERCENT
                                const dermatologistGets = p.amount - systemCut

                                return (
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-blue-50/40 transition"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-semibold text-emerald-700">
                                                    {p.patient[0]}
                                                </div>
                                                <span className="font-medium text-gray-800">{p.patient}</span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                                                    {p.dermatologist.split(' ')[1][0]}
                                                </div>
                                                <span className="font-medium text-gray-800">{p.dermatologist}</span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-right font-medium">
                                            PKR {p.amount.toLocaleString()}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                                PKR {systemCut.toLocaleString()}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                                PKR {dermatologistGets.toLocaleString()}
                                            </span>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>

                        <tfoot className="bg-gray-50 border-t">
                            <tr>
                                <td colSpan={2} className="px-5 py-4 font-semibold text-gray-700">Total</td>
                                <td className="px-5 py-4 text-right font-semibold">PKR {totalPayments.toLocaleString()}</td>
                                <td className="px-5 py-4 text-right font-semibold text-blue-700">PKR {systemRevenue.toLocaleString()}</td>
                                <td className="px-5 py-4 text-right font-semibold text-emerald-700">PKR {dermatologistRevenue.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default SystemRevenue
