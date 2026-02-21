import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ToggleLeft, ToggleRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockPatients } from '../../mock-data/patients'
import { mockDermatologists } from '../../mock-data/dermatologists'
import { useToastStore } from '../../store/toastStore'

const UserManagement = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [activeTab, setActiveTab] = useState('patients')

  const handleToggle = (userId, type) => {
    addToast({ type: 'success', title: 'Status Updated', message: `User ${type} status updated` })
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'User Management' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage patients and dermatologists</p>
      </div>
      <div className="flex gap-2 mb-6">
        <Button variant={activeTab === 'patients' ? 'primary' : 'outline'} onClick={() => setActiveTab('patients')}>
          Patients ({mockPatients.length})
        </Button>
        <Button variant={activeTab === 'dermatologists' ? 'primary' : 'outline'} onClick={() => setActiveTab('dermatologists')}>
          Dermatologists ({mockDermatologists.length})
        </Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'patients' ? mockPatients : mockDermatologists).map((user, index) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Active</span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleToggle(user.id, 'deactivated')} className="text-emerald-600 hover:text-emerald-700">
                      <ToggleRight className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default UserManagement
