import { create } from 'zustand'
import { logout } from './authService'

export interface CurrentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

interface AuthState {
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser) => void
  hasRole: (role: string | string[]) => boolean
  logout: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  hasRole: (role) => {
    const { currentUser } = get()
    if (!currentUser) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.some((r) => currentUser.roles.includes(r))
  },

  logout: () => {
    set({ currentUser: null })
    logout()
  },
}))
