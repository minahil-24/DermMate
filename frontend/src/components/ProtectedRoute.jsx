import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={`/dashboard/${role}`} replace />
  }

  if (isAuthenticated && role !== 'admin' && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default ProtectedRoute
