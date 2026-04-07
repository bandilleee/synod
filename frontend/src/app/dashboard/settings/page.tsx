"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/authStore"
import { api } from "@/lib/api/client"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, User, Lock, Building } from "lucide-react"

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  
  // Profile form state
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

  const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const apiError = error as {
        response?: {
          data?: {
            error?: {
              message?: string
            }
          }
        }
      }

      return apiError.response?.data?.error?.message || fallbackMessage
    }

    return fallbackMessage
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!email.trim()) {
      toast.error("Email is required")
      return
    }

    setProfileLoading(true)
    try {
      const response = await api.put("/auth/profile", { name, email })
      setUser(response.data.data)
      toast.success("Profile updated successfully")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update profile"))
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword) {
      toast.error("Current password is required")
      return
    }
    if (!newPassword) {
      toast.error("New password is required")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setPasswordLoading(true)
    try {
      await api.put("/auth/password", { currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed successfully")
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to change password"))
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <div className="max-w-2xl space-y-8">
        {/* Profile Section */}
        <div className="p-6 border border-white/5 rounded-lg bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/5 rounded-md border border-white/5">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-zinc-200">Profile</h2>
              <p className="text-sm text-zinc-500">Update your personal information</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <Button type="submit" disabled={profileLoading}>
              {profileLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </div>

        {/* Organization Section (read-only) */}
        {user?.organization && (
          <div className="p-6 border border-white/5 rounded-lg bg-zinc-900/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/5 rounded-md border border-white/5">
                <Building className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-zinc-200">Organization</h2>
                <p className="text-sm text-zinc-500">Your organization details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-500">Organization Name</Label>
                <p className="text-zinc-200">{user.organization.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500">Role</Label>
                <p className="text-zinc-200">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        <Separator className="bg-white/5" />

        {/* Password Section */}
        <div className="p-6 border border-white/5 rounded-lg bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/5 rounded-md border border-white/5">
              <Lock className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-zinc-200">Password</h2>
              <p className="text-sm text-zinc-500">Change your password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
