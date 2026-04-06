import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5048/api"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" 
      ? localStorage.getItem("accessToken") 
      : null
    
    if (token) {
      config.headers.Authorization = Bearer 
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token (will implement in Phase 3)
      const refreshToken = localStorage.getItem("refreshToken")
      if (refreshToken) {
        try {
          const response = await axios.post(${API_URL}/auth/refresh, {
            refreshToken,
          })
          
          const { accessToken } = response.data.data
          localStorage.setItem("accessToken", accessToken)
          
          originalRequest.headers.Authorization = Bearer 
          return api(originalRequest)
        } catch {
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          window.location.href = "/login"
        }
      }
    }

    return Promise.reject(error)
  }
)
