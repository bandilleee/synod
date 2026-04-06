"use client"

import Link from "next/link"
import { FileText, Mail, Calendar, Plus } from "lucide-react"
import { PageHeader, StatCard } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores"

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div>
      <PageHeader
        title={"Welcome back, " + (user?.name?.split(" ")[0] || "User") + "!"}
        description="Manage your forms, newsletters, and events"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Forms" value={0} icon={FileText} />
        <StatCard title="Newsletters" value={0} icon={Mail} />
        <StatCard title="Events" value={0} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/forms/new"
          className="p-6 border border-white/5 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 bg-white/5 rounded-md group-hover:bg-white/10 transition-colors">
              <FileText className="w-5 h-5 text-zinc-400" />
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
            <div className="p-2 bg-white/5 rounded-md group-hover:bg-white/10 transition-colors">
              <Mail className="w-5 h-5 text-zinc-400" />
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
            <div className="p-2 bg-white/5 rounded-md group-hover:bg-white/10 transition-colors">
              <Calendar className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-200">Plan Event</h3>
          </div>
          <p className="text-sm text-zinc-500">Create an event for leader approval</p>
        </Link>
      </div>
    </div>
  )
}
