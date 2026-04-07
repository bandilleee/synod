import { create } from "zustand"
import { api } from "@/lib/api"
import type { User } from "@/types"

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Helper to delete cookie
const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

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

      // Store in localStorage for API client
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      
      // Also set cookies for middleware
      setCookie("accessToken", accessToken, 1) // 1 day for access token
      setCookie("refreshToken", refreshToken, 7) // 7 days for refresh token

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
      deleteCookie("accessToken")
      deleteCookie("refreshToken")
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
      deleteCookie("accessToken")
      deleteCookie("refreshToken")
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}))
