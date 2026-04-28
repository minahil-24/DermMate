import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Wallet, AlertTriangle, CheckCircle, CalendarDays, Loader2, ArrowRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const DermatologistPayments = () => {
    const { token } = useAuthStore()
    const addToast = useToastStore((s) => s.addToast)
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    const [loading, setLoading] = useState(true)
    const [billingData, setBillingData] = useState(null)
    const [paying, setPaying] = useState(false)

    const fetchBilling = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${apiUrl}/api/billing/dermatologist`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setBillingData(res.data.data)
        } catch (error) {
            console.error(error)
            addToast({ type: 'error', title: 'Error', message: 'Failed to fetch billing data' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchBilling()
    }, [token])

    const handlePay = async () => {
        try {
            setPaying(true)
            const res = await axios.post(`${apiUrl}/api/billing/stripe/create-dermatologist-session`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Payment Failed', message: error.response?.data?.message || 'Error processing payment' })
        } finally {
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        )
    }

    const { totalCharges = 0, systemFeePending = 0, systemFeePaid = 0, payments = [], feePaymentDeadline, blockedDueToUnpaidFee } = billingData || {}
    const isOverdue = feePaymentDeadline && new Date() > new Date(feePaymentDeadline)

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-6">
            <Breadcrumbs items={[{ label: 'Billing & Payments' }]} />

            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Payments</h1>
                <p className="text-gray-600">Track your appointment charges and settle 5% system fees.</p>
            </div>

            {/* Status Alert */}
            {blockedDueToUnpaidFee ? (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-full shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900 mb-1">Account Blocked</h3>
                        <p className="text-red-700">Your account activities have been temporarily blocked due to unpaid system fees. Please settle your dues to restore full access to your cases and appointments.</p>
                    </div>
                </motion.div>
            ) : isOverdue && systemFeePending > 0 ? (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    <p className="text-amber-800 font-medium">Your system fee payment is overdue. Please pay it as soon as possible to avoid account restrictions.</p>
                </motion.div>
            ) : null}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white/20 p-3 rounded-xl"><Wallet className="w-6 h-6 text-white" /></div>
                    </div>
                    <p className="text-emerald-100 text-sm font-medium mb-1">Total Appointment Revenue</p>
                    <h3 className="text-3xl font-bold">PKR {totalCharges.toLocaleString()}</h3>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white/20 p-3 rounded-xl"><ArrowRight className="w-6 h-6 text-white" /></div>
                        <div className="text-right">
                            <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Paid</p>
                            <p className="text-lg font-bold">PKR {systemFeePaid.toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-red-100 text-sm font-medium mb-1">Total Pending System Fee (5%)</p>
                    <h3 className="text-3xl font-bold">PKR {systemFeePending.toLocaleString()}</h3>
                    {systemFeePending > 0 ? (
                        <Button
                            onClick={handlePay}
                            disabled={paying}
                            className="bg-neon text-red-600 hover:bg-gray-50 mt-4 w-full border-none shadow-sm"
                        >
                            {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Pay PKR {systemFeePending.toLocaleString()} Now
                        </Button>
                    ) : (
                        <div className="bg-white/20 text-white mt-4 py-2 px-4 rounded-lg flex items-center justify-center font-semibold">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            All Dues Cleared
                        </div>
                    )}
                </Card>

                <Card className="bg-white shadow-sm border border-gray-100 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <CalendarDays className="w-5 h-5 text-gray-400" />
                        <h4 className="font-semibold text-gray-700">Payment Deadline</h4>
                    </div>
                    {feePaymentDeadline ? (
                        <>
                            <p className="text-xl font-bold text-gray-900">{new Date(feePaymentDeadline).toLocaleDateString()}</p>
                            <p className="text-sm mt-1 text-gray-500">Set by administrator</p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-gray-900">No Deadline Set</p>
                    )}
                </Card>
            </div>

            {/* Appointments Breakdowns */}
            <h2 className="text-xl font-bold text-gray-900 pt-4">Charge Breakdown</h2>
            <Card className="overflow-hidden p-0 shadow-sm border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                            <tr>
                                <th className="py-4 px-6 font-semibold">Appointment Date</th>
                                <th className="py-4 px-6 font-semibold">Patient</th>
                                <th className="py-4 px-6 font-semibold text-right">Total Charge</th>
                                <th className="py-4 px-6 font-semibold text-right text-red-600">5% System Deduct</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500 italic">No billable appointments available</td>
                                </tr>
                            ) : (
                                payments.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-gray-900">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="py-4 px-6 text-gray-600">{p.patient}</td>
                                        <td className="py-4 px-6 text-right font-medium text-gray-900">PKR {p.amount.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right font-medium text-red-600">PKR {p.systemFee.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default DermatologistPayments
