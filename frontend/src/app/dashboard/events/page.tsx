"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  Calendar,
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  MapPin,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Ban
} from "lucide-react"
import { PageHeader, ConfirmDialog } from "@/components/shared"
import { TableSkeleton } from "@/components/skeletons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEvents, useDeleteEvent, useCancelEvent, type Event } from "@/lib/hooks"
import { formatDate, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"

export default function EventsPage() {
  const { data: events, isLoading } = useEvents()
  const deleteEvent = useDeleteEvent()
  const cancelEvent = useCancelEvent()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return
    try {
      await deleteEvent.mutateAsync(selectedEvent.id)
      toast.success("Event deleted")
    } catch {
      toast.error("Failed to delete event")
    }
    setSelectedEvent(null)
  }

  const handleCancelClick = (event: Event) => {
    setSelectedEvent(event)
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedEvent) return
    try {
      await cancelEvent.mutateAsync(selectedEvent.id)
      toast.success("Event cancelled")
    } catch {
      toast.error("Failed to cancel event")
    }
    setSelectedEvent(null)
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

  const canEdit = (event: Event) => {
    return event.status === "PendingApproval" || event.status === "Approved"
  }

  const canCancel = (event: Event) => {
    return event.status === "PendingApproval" || event.status === "Approved"
  }

  const canDelete = (event: Event) => {
    return event.status !== "Completed"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Plan and manage collaborative events with your team"
      >
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Propose Event
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : events?.length === 0 ? (
        <div className="text-center py-12 border border-white/5 rounded-lg bg-zinc-900/30">
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No events yet</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Propose your first event to start collaborating with your team
          </p>
          <Button asChild>
            <Link href="/dashboard/events/new">
              <Plus className="w-4 h-4 mr-2" />
              Propose Event
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500">Event</TableHead>
                <TableHead className="text-zinc-500">Date</TableHead>
                <TableHead className="text-zinc-500">Location</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Approvals</TableHead>
                <TableHead className="text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id} className="border-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{event.title}</p>
                      <p className="text-xs text-zinc-500">by {event.createdByName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(event.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.location ? (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Users className="w-4 h-4" />
                      {event.currentApprovals}/{event.requiredApprovals}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={"/dashboard/events/" + event.id}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEdit(event) && (
                          <DropdownMenuItem asChild>
                            <Link href={"/dashboard/events/" + event.id + "/edit"}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canCancel(event) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleCancelClick(event)}
                              className="text-yellow-500 focus:text-yellow-500"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Cancel Event
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete(event) && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(event)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Event"
        description={"Are you sure you want to delete \"" + (selectedEvent?.title || "") + "\"? This action cannot be undone."}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Event"
        description={"Are you sure you want to cancel \"" + (selectedEvent?.title || "") + "\"? All approvals will be voided."}
        confirmText="Cancel Event"
        variant="destructive"
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}
