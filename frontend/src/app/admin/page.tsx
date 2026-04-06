"use client"

import Link from "next/link"
import { Users, Building2, UserCheck, Calendar } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { StatCardSkeleton } from "@/components/skeletons"
import { useAdminStats } from "@/lib/hooks"

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your platform"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Organizations"
              value={stats?.totalOrganizations ?? 0}
              icon={Building2}
            />
            <StatCard
              title="Leaders"
              value={stats?.totalLeaders ?? 0}
              icon={Users}
            />
            <StatCard
              title="Members"
              value={stats?.totalMembers ?? 0}
              icon={UserCheck}
            />
            <StatCard
              title="Events"
              value={stats?.totalEvents ?? 0}
              icon={Calendar}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 p-6">
          <h3 className="text-lg font-medium text-zinc-200 mb-4">Pending Items</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-zinc-400">Pending Invitations</span>
              <span className="text-sm font-medium text-white">{stats?.pendingInvitations ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-400">Events Awaiting Approval</span>
              <span className="text-sm font-medium text-white">{stats?.pendingEventApprovals ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="border border-white/5 rounded-lg bg-zinc-900/30 p-6">
          <h3 className="text-lg font-medium text-zinc-200 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/admin/organizations"
              className="block p-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm text-zinc-200">Manage Organizations</span>
              <p className="text-xs text-zinc-500 mt-1">Add, edit or remove organizations</p>
            </Link>
            <Link
              href="/admin/leaders"
              className="block p-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm text-zinc-200">Invite Leaders</span>
              <p className="text-xs text-zinc-500 mt-1">Send invitations to new leaders</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
