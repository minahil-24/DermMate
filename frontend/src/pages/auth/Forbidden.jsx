import { ShieldAlert, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'

const Forbidden = () => {
  const { role } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8 font-medium">
          You do not have permission to view this page. This area is restricted to administrators only.
        </p>

        <Link
          to={role ? `/dashboard/${role}` : '/login'}
          className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <Home size={20} />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  )
}

export default Forbidden
