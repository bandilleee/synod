"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores"
import { AdminSidebar, AdminMobileNav, LoadingScreen } from "@/components/shared"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, refreshUser } = useAuthStore()

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
    if (!isLoading && isAuthenticated && user?.role !== "SuperAdmin") {
      router.push("/dashboard")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user || user.role !== "SuperAdmin") {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Mobile Navigation */}
      <AdminMobileNav />
      
      {/* Desktop Sidebar */}
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
