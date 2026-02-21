import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      
      login: (userData, token, role) => {
        set({
          user: userData,
          token,
          role,
          isAuthenticated: true,
        })
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('auth-storage')
      },
      
      updateUser: (userData) => {
        set({ user: userData })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
