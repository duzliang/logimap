import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, TeamSummary } from '../types/auth.types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  currentTeamId: string | null
  teams: TeamSummary[]
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setAuth: (user: User, token: string) => void
  setLoading: (loading: boolean) => void
  setCurrentTeamId: (teamId: string | null) => void
  setTeams: (teams: TeamSummary[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      currentTeamId: null,
      teams: [],

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user && !!state.token
        })),

      setToken: (token) => {
        set((state) => ({
          token,
          isAuthenticated: !!state.user && !!token
        }))
      },

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },

      setLoading: (isLoading) => set({ isLoading }),

      setCurrentTeamId: (currentTeamId) => set({ currentTeamId }),

      setTeams: (teams) => set({ teams }),

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentTeamId: null,
          teams: []
        })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        currentTeamId: state.currentTeamId,
        teams: state.teams
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.user) {
          return { isAuthenticated: true }
        }
      }
    }
  )
)
