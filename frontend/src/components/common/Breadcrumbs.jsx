import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const Breadcrumbs = ({ items }) => {
  const { role } = useAuthStore()
  const location = useLocation()
  
  // Determine dashboard path based on role
  const getDashboardPath = () => {
    if (role === 'patient') return '/dashboard/patient'
    if (role === 'dermatologist') return '/dashboard/dermatologist'
    if (role === 'admin') return '/dashboard/admin'
    return '/dashboard/patient' // default
  }
  
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
      <Link to={getDashboardPath()} className="hover:text-emerald-600 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          {item.link ? (
            <Link to={item.link} className="hover:text-emerald-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumbs
