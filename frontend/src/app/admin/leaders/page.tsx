"use client"

import { useState } from "react"
import { Plus, Users, MoreHorizontal, UserX, UserCheck, Trash2 } from "lucide-react"
import { PageHeader, EmptyState, ConfirmDialog } from "@/components/shared"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useLeaders,
  useSuspendLeader,
  useReactivateLeader,
  useDeleteLeader,
} from "@/lib/hooks"
import { InviteLeaderForm } from "./InviteLeaderForm"
import { toast } from "sonner"

type Leader = {
  id: string
  name: string
  email: string
  status: string
  organization?: { name: string } | null
}

export default function LeadersPage() {
  const { data: leaders, isLoading } = useLeaders()
  const suspendLeader = useSuspendLeader()
  const reactivateLeader = useReactivateLeader()
  const deleteLeader = useDeleteLeader()
  
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null)

  const handleSuspendClick = (leader: Leader) => {
    setSelectedLeader(leader)
    setSuspendDialogOpen(true)
  }

  const handleSuspendConfirm = async () => {
    if (!selectedLeader) return
    try {
      await suspendLeader.mutateAsync(selectedLeader.id)
      toast.success("Leader suspended")
    } catch {
      toast.error("Failed to suspend leader")
    }
    setSelectedLeader(null)
  }

  const handleReactivate = async (id: string) => {
    try {
      await reactivateLeader.mutateAsync(id)
      toast.success("Leader reactivated")
    } catch {
      toast.error("Failed to reactivate leader")
    }
  }

  const handleDeleteClick = (leader: Leader) => {
    setSelectedLeader(leader)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedLeader) return
    try {
      await deleteLeader.mutateAsync(selectedLeader.id)
      toast.success("Leader deleted")
    } catch {
      toast.error("Failed to delete leader")
    }
    setSelectedLeader(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
      case "Pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
      case "Suspended":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div>
      <PageHeader
        title="Leaders"
        description="Manage leaders across all organizations"
      >
        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Leader
        </Button>
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : leaders?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leaders yet"
          description="Invite your first leader to get started"
          action={
            <Button onClick={() => setShowInviteDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Leader
            </Button>
          }
        />
      ) : (
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500">Name</TableHead>
                <TableHead className="text-zinc-500">Email</TableHead>
                <TableHead className="text-zinc-500">Organization</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaders?.map((leader) => (
                <TableRow key={leader.id} className="border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-xs text-white font-bold border border-white/10">
                        {leader.name.charAt(0)}
                      </div>
                      <span className="font-medium text-zinc-200">{leader.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">{leader.email}</TableCell>
                  <TableCell className="text-zinc-400">
                    {leader.organization?.name || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(leader.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {leader.status === "Active" ? (
                          <DropdownMenuItem onClick={() => handleSuspendClick(leader)}>
                            <UserX className="w-4 h-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        ) : leader.status === "Suspended" ? (
                          <DropdownMenuItem onClick={() => handleReactivate(leader.id)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(leader)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Leader</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new leader
            </DialogDescription>
          </DialogHeader>
          <InviteLeaderForm onSuccess={() => setShowInviteDialog(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        title="Suspend Leader"
        description={"Are you sure you want to suspend " + (selectedLeader?.name || "") + "? They will no longer be able to access the platform until reactivated."}
        confirmText="Suspend"
        variant="destructive"
        onConfirm={handleSuspendConfirm}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Leader"
        description={"Are you sure you want to delete " + (selectedLeader?.name || "") + "? This action cannot be undone and they will be permanently removed from the platform."}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
