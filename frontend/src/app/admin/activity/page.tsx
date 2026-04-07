"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { 
  Activity, 
  Mail, 
  FileText, 
  Calendar, 
  Users, 
  LogIn, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash,
  Send,
  UserPlus,
  Building
} from "lucide-react"
import { PageHeader } from "@/components/shared"
import { useActivities } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const actionCategories = [
  { value: "all", label: "All Activities" },
  { value: "Newsletter", label: "Newsletters" },
  { value: "Form", label: "Forms" },
  { value: "Event", label: "Events" },
  { value: "Member", label: "Members" },
  { value: "Auth", label: "Authentication" },
  { value: "Organization", label: "Organizations" },
]

function getActionIcon(action: string) {
  if (action.includes("Newsletter")) {
    if (action.includes("Sent")) return <Send className="w-4 h-4" />
    return <Mail className="w-4 h-4" />
  }
  if (action.includes("Form")) {
    if (action.includes("Submission")) return <FileText className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }
  if (action.includes("Event")) {
    if (action.includes("Approved")) return <CheckCircle className="w-4 h-4" />
    if (action.includes("Rejected")) return <XCircle className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }
  if (action.includes("Member")) return <Users className="w-4 h-4" />
  if (action.includes("User")) {
    if (action.includes("Invited")) return <UserPlus className="w-4 h-4" />
    if (action.includes("LoggedIn")) return <LogIn className="w-4 h-4" />
    return <Users className="w-4 h-4" />
  }
  if (action.includes("Organization")) return <Building className="w-4 h-4" />
  if (action.includes("Updated")) return <Edit className="w-4 h-4" />
  if (action.includes("Deleted")) return <Trash className="w-4 h-4" />
  return <Activity className="w-4 h-4" />
}

function getActionColor(action: string) {
  if (action.includes("Sent") || action.includes("Approved") || action.includes("Published") || action.includes("Created")) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
  if (action.includes("Rejected") || action.includes("Deleted") || action.includes("Cancelled")) {
    return "bg-red-500/10 text-red-400 border-red-500/20"
  }
  if (action.includes("Updated") || action.includes("Submission")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20"
  }
  if (action.includes("LoggedIn") || action.includes("Invited")) {
    return "bg-purple-500/10 text-purple-400 border-purple-500/20"
  }
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
}

export default function AdminActivityPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("all")
  
  const { data, isLoading } = useActivities(page, 50)

  const filteredActivities = data?.activities.filter(activity => {
    if (category === "all") return true
    if (category === "Auth") {
      return activity.action.includes("User") && 
        (activity.action.includes("LoggedIn") || 
         activity.action.includes("Invited") || 
         activity.action.includes("Accepted"))
    }
    if (category === "Organization") {
      return activity.action.includes("Organization")
    }
    return activity.entityType === category
  }) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Complete activity history across the platform"
      />

      <div className="flex items-center gap-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48 bg-zinc-900/50 border-zinc-800">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {actionCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-sm text-zinc-500">
          {data?.totalCount ?? 0} total events
        </p>
      </div>

      <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No activity yet</h3>
            <p className="text-sm text-zinc-500">
              Activity will appear here as users interact with the platform.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                <div className={"w-10 h-10 rounded-full border flex items-center justify-center " + getActionColor(activity.action)}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">
                    <span className="font-medium text-white">{activity.userName || "System"}</span>
                    {" "}
                    <span className="text-zinc-400">{activity.actionDisplay}</span>
                    {activity.entityName && (
                      <>
                        {": "}
                        <span className="font-medium text-zinc-300">{activity.entityName}</span>
                      </>
                    )}
                    {activity.details && (
                      <span className="text-zinc-500"> ({activity.details})</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Page {data.page} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
