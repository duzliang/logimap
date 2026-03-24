import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../types/auth.types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user && !!state.token
        })),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('token', token)
        }
        set((state) => ({
          token,
          isAuthenticated: !!state.user && !!token
        }))
      },

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // 恢复状态后，根据是否有 token 设置认证状态
        if (state?.token && state?.user) {
          state.isAuthenticated = true
        }
      }
    }
  )
)
