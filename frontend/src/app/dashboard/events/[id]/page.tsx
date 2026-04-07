"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Ban
} from "lucide-react"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  useEvent, 
  useApproveEvent, 
  useRejectEvent,
  useCancelEvent
} from "@/lib/hooks"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: event, isLoading } = useEvent(id)
  const approveEvent = useApproveEvent()
  const rejectEvent = useRejectEvent()
  const cancelEvent = useCancelEvent()

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState("")

  const handleApprove = async () => {
    try {
      await approveEvent.mutateAsync({ id })
      toast.success("Event approved!")
    } catch {
      toast.error("Failed to approve event")
    }
  }

  const handleReject = async () => {
    try {
      await rejectEvent.mutateAsync({ id, data: { comment: rejectComment || undefined } })
      toast.success("Event rejected")
      setRejectDialogOpen(false)
      setRejectComment("")
    } catch {
      toast.error("Failed to reject event")
    }
  }

  const handleCancel = async () => {
    try {
      await cancelEvent.mutateAsync(id)
      toast.success("Event cancelled")
      setCancelDialogOpen(false)
      router.push("/dashboard/events")
    } catch {
      toast.error("Failed to cancel event")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingApproval":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending Approval</Badge>
      case "Approved":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>
      case "Cancelled":
        return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Cancelled</Badge>
      case "Completed":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-2">Event not found</h2>
        <Button asChild>
          <Link href="/dashboard/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  // Check if current user has a pending approval
  const myApproval = event.approvals.find(a => a.status === "Pending")
  const canApprove = event.status === "PendingApproval" && myApproval
  const canCancel = event.status === "PendingApproval" || event.status === "Approved"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-white">{event.title}</h1>
            {getStatusBadge(event.status)}
          </div>
          <p className="text-zinc-500">Proposed by {event.createdByName}</p>
        </div>
        
        <div className="flex gap-2">
          {canApprove && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setRejectDialogOpen(true)}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={approveEvent.isPending}>
                {approveEvent.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
            </>
          )}
          {canCancel && (
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(true)}
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Event
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Event Details */}
        <div className="space-y-4 p-6 border border-white/5 rounded-lg bg-zinc-900/30">
          <h2 className="text-lg font-medium text-white">Event Details</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-zinc-300">{formatDateTime(event.date)}</p>
                {event.endDate && (
                  <p className="text-zinc-500 text-sm">to {formatDateTime(event.endDate)}</p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-zinc-500 mt-0.5" />
                <p className="text-zinc-300">{event.location}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-zinc-500 mt-0.5" />
              <p className="text-zinc-300">Proposed by {event.createdByName}</p>
            </div>
          </div>

          {event.description && (
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
              <p className="text-zinc-300 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        {/* Approval Status */}
        <div className="space-y-4 p-6 border border-white/5 rounded-lg bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Approvals</h2>
            <span className="text-sm text-zinc-500">
              {event.currentApprovals}/{event.requiredApprovals} approved
            </span>
          </div>

          {event.approvals.length === 0 ? (
            <p className="text-zinc-500 text-sm">No approvals required - event is automatically approved.</p>
          ) : (
            <div className="space-y-3">
              {event.approvals.map((approval) => (
                <div 
                  key={approval.id} 
                  className="flex items-start justify-between p-3 rounded-lg bg-zinc-800/50"
                >
                  <div className="flex items-start gap-3">
                    {getApprovalStatusIcon(approval.status)}
                    <div>
                      <p className="text-zinc-200 font-medium">{approval.userName}</p>
                      <p className="text-zinc-500 text-sm">
                        {approval.status === "Pending" 
                          ? "Awaiting response" 
                          : approval.respondedAt 
                            ? formatDateTime(approval.respondedAt)
                            : approval.status
                        }
                      </p>
                      {approval.comment && (
                        <p className="text-zinc-400 text-sm mt-1 italic">&quot;{approval.comment}&quot;</p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    className={
                      approval.status === "Approved" 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : approval.status === "Rejected"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    }
                  >
                    {approval.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Event</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to reject &quot;{event.title}&quot;? You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-comment">Reason (optional)</Label>
              <Textarea
                id="reject-comment"
                placeholder="Why are you rejecting this event?"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                className="bg-zinc-800 border-zinc-700 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={rejectEvent.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectEvent.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Event"
        description={"Are you sure you want to cancel \"" + event.title + "\"? This action cannot be undone."}
        confirmText="Cancel Event"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  )
}