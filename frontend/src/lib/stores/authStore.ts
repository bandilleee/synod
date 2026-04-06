import { create } from "zustand"
import { api } from "@/lib/api"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)

      set({ user, isAuthenticated: true, isLoading: false })
      return true
    } catch {
      return false
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      set({ user: null, isAuthenticated: false })
    }
  },

  refreshUser: async () => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const response = await api.get("/auth/me")
      set({ user: response.data.data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}))
