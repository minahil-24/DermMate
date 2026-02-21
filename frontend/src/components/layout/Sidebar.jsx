import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Bell,
  User,
  LogOut,
  Search,
  FileText,
  Image,
  Stethoscope,
  Users,
  Settings,
  Activity,
  ClipboardList,
  Camera,
  Heart,
  Building2,
  Wallet
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const Sidebar = () => {
  const { role, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)

  const handleLogout = () => {
    logout()
    addToast({
      type: 'success',
      title: 'Logged Out',
      message: 'You have been successfully logged out',
    })
    navigate('/login')
  }

  const linkBase = 'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200'

  const linkStyle = ({ isActive }) =>
    `${linkBase} ${isActive
      ? 'bg-emerald-600 text-white shadow-md border-l-4 border-emerald-700'
      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
    }`

  const patientLinks = [
    { to: '/dashboard/patient', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/cases', icon: Briefcase, label: 'My Cases' },
    { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/patient/records', icon: FileText, label: 'Medical Records' },
    { to: '/patient/treatment', icon: ClipboardList, label: 'Treatment Plans' },
    { to: '/patient/follow-up', icon: Activity, label: 'Follow-ups' },
    { to: '/patient/dermatologists', icon: Search, label: 'Find Dermatologist' },
    { to: '/patient/clinics', icon: Building2, label: 'Clinics' },
    { to: '/patient/notifications', icon: Bell, label: 'Notifications' },
    { to: '/patient/profile', icon: User, label: 'Profile' },
  ]

  const dermatologistLinks = [
    { to: '/dashboard/dermatologist', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dermatologist/certification', icon: FileText, label: 'Certification' },
    { to: '/dermatologist/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/dermatologist/cases', icon: Briefcase, label: 'Patient Cases' },
    { to: '/dermatologist/notifications', icon: Bell, label: 'Notifications' },
    { to: '/dermatologist/profile', icon: User, label: 'Profile' },
  ]

  const adminLinks = [
    { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/verification', icon: Stethoscope, label: 'Verification' },
    { to: '/admin/ai-models', icon: Settings, label: 'AI Models' },
    { to: '/admin/reports', icon: FileText, label: 'Reports & Analytics' },
    { to: '/admin/notifications', icon: Bell, label: 'Broadcast' },
    { to: '/admin/system-revenue', icon: Wallet, label: 'Revenue' },

  ]

  const links = role === 'patient' ? patientLinks : role === 'dermatologist' ? dermatologistLinks : adminLinks

  return (
    <aside className="w-64 bg-gradient-to-b from-emerald-50 to-white min-h-screen p-6 flex flex-col justify-between shadow-lg sticky top-0">
      {/* Top Logo */}
      <div className="flex justify-center mb-8">
        <motion.img
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          src="/imgs/logoo222.png"
          alt="DermMate Logo"
          className="w-48 h-48 object-cover rounded-full shadow-lg"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink key={link.to} to={link.to} className={linkStyle}>
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Profile / Footer */}
      <div className="pt-6 mt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow mb-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden shadow-inner">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
            <NavLink
              to={`/${role}/profile`}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <User size={14} /> View Profile
            </NavLink>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
