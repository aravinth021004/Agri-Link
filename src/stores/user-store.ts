import { create } from 'zustand'

interface User {
  id: string
  email: string
  phone: string
  fullName: string
  role: 'CUSTOMER' | 'FARMER' | 'ADMIN'
  profileImage?: string | null
}

interface UserStore {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  logout: () => set({ user: null }),
}))
