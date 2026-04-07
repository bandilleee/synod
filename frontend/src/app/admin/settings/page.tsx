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
import { Loader2, User, Lock, Shield } from "lucide-react"

export default function AdminSettingsPage() {
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
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to update profile")
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
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to change password")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your admin account settings"
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

        {/* Role Section (read-only) */}
        <div className="p-6 border border-white/5 rounded-lg bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/5 rounded-md border border-white/5">
              <Shield className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-zinc-200">Account</h2>
              <p className="text-sm text-zinc-500">Your account details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-500">Role</Label>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

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
