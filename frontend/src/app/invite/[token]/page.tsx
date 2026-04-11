"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { isAxiosError } from "axios"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/stores"

// Helper to set cookie (same as in authStore)
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const acceptSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type AcceptForm = z.infer<typeof acceptSchema>

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const setUser = useAuthStore((state) => state.setUser)
  
  const [status, setStatus] = useState<"valid" | "invalid" | "success">(
    token ? "valid" : "invalid"
  )
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
  })

  const onSubmit = async (data: AcceptForm) => {
    setError(null)
    try {
      const response = await api.post("/auth/accept-invitation", {
        token,
        name: data.name,
        password: data.password,
      })

      const { accessToken, refreshToken, user } = response.data.data
      
      // Store in localStorage for API client
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      
      // Also set cookies for middleware (this was missing!)
      setCookie("accessToken", accessToken, 1) // 1 day for access token
      setCookie("refreshToken", refreshToken, 7) // 7 days for refresh token
      
      setUser(user)
      
      setStatus("success")
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: unknown) {
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || "Invalid or expired invitation"
        : "Invalid or expired invitation"
      setError(message)
      setStatus("invalid")
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome to Synod!</h2>
              <p className="text-zinc-400 text-sm">Your account has been created. Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Invalid Invitation</h2>
              <p className="text-zinc-400 text-sm mb-4">
                {error || "This invitation link is invalid or has expired."}
              </p>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Join Synod</CardTitle>
          <CardDescription>Complete your account setup</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
                className="bg-zinc-900 border-zinc-700"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="bg-zinc-900 border-zinc-700"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="bg-zinc-900 border-zinc-700"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}