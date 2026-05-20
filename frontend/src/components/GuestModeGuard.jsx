import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '../store/toastStore'
import { useEffect } from 'react'

const GuestModeGuard = ({ children }) => {
  const { isGuest } = useAuthStore()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    if (isGuest) {
      addToast({
        type: 'info',
        title: 'Sign In Required',
        message: 'Please sign in or create an account to book an appointment.',
      })
      navigate('/login', { replace: true })
    }
  }, [isGuest, navigate, addToast])

  if (isGuest) {
    return null
  }

  return children
}

export default GuestModeGuard
