"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingScreen } from "@/components/shared"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuthStore()

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Welcome, {user.name}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-zinc-400 space-y-2">
              <p><span className="text-zinc-500">Email:</span> {user.email}</p>
              <p><span className="text-zinc-500">Role:</span> {user.role}</p>
              <p><span className="text-zinc-500">Status:</span> {user.status}</p>
              {user.organizationName && (
                <p><span className="text-zinc-500">Organization:</span> {user.organizationName}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
