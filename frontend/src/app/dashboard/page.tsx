"use client"

import Link from "next/link"
import { FileText, Mail, Calendar, Users, ArrowRight } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { StatCardSkeleton } from "@/components/skeletons"
import { useAuthStore } from "@/lib/stores"
import { useForms, useNewsletters, useEvents, usePendingApprovals } from "@/lib/hooks"
import { useMemberStats } from "@/lib/hooks/useMembers"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: forms, isLoading: formsLoading } = useForms()
  const { data: newsletters, isLoading: newslettersLoading } = useNewsletters()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const { data: pendingApprovals, isLoading: pendingLoading } = usePendingApprovals()
  const { data: memberStats, isLoading: membersLoading } = useMemberStats()

  const isLoading = formsLoading || newslettersLoading || eventsLoading || membersLoading

  return (
    <div className="space-y-8">
      <PageHeader
        title={"Welcome back, " + (user?.name?.split(" ")[0] || "User") + "!"}
        description="Manage your forms, newsletters, and events"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              title="Forms" 
              value={forms?.length || 0} 
              icon={FileText} 
              valueClassName="text-amber-400" 
            />
            <StatCard 
              title="Newsletters" 
              value={newsletters?.length || 0} 
              icon={Mail} 
              valueClassName="text-blue-400" 
            />
            <StatCard 
              title="Events" 
              value={events?.length || 0} 
              icon={Calendar} 
              valueClassName="text-emerald-400" 
            />
            <StatCard 
              title="Members" 
              value={memberStats?.totalMembers || 0} 
              icon={Users} 
              valueClassName="text-purple-400" 
            />
          </>
        )}
      </div>

      {/* Pending Approvals */}
      {!pendingLoading && pendingApprovals && pendingApprovals.length > 0 && (
        <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-400">Pending Approvals</h3>
              <p className="text-xs text-yellow-400/70 mt-1">
                You have {pendingApprovals.length} event{pendingApprovals.length > 1 ? "s" : ""} awaiting your approval
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
              <Link href="/dashboard/events">
                Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-zinc-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/forms/new"
            className="p-6 border border-white/5 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-md group-hover:bg-amber-500/20 transition-colors">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200">Create Form</h3>
            </div>
            <p className="text-sm text-zinc-500">Build a form to collect data from members</p>
          </Link>

          <Link
            href="/dashboard/newsletters/new"
            className="p-6 border border-white/5 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-md group-hover:bg-blue-500/20 transition-colors">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200">Send Newsletter</h3>
            </div>
            <p className="text-sm text-zinc-500">Create and send newsletters to members</p>
          </Link>

          <Link
            href="/dashboard/events/new"
            className="p-6 border border-white/5 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-md group-hover:bg-emerald-500/20 transition-colors">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200">Plan Event</h3>
            </div>
            <p className="text-sm text-zinc-500">Create an event for leader approval</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
