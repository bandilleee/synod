"use client"

import { useState } from "react"
import { Plus, Users, MoreHorizontal, UserX, UserCheck, Trash2, Mail } from "lucide-react"
import { PageHeader, EmptyState } from "@/components/shared"
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

export default function LeadersPage() {
  const { data: leaders, isLoading } = useLeaders()
  const suspendLeader = useSuspendLeader()
  const reactivateLeader = useReactivateLeader()
  const deleteLeader = useDeleteLeader()
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const handleSuspend = async (id: string) => {
    if (confirm("Are you sure you want to suspend this leader?")) {
      await suspendLeader.mutateAsync(id)
    }
  }

  const handleReactivate = async (id: string) => {
    await reactivateLeader.mutateAsync(id)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this leader? This cannot be undone.")) {
      await deleteLeader.mutateAsync(id)
    }
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
                    {leader.organizationName || "-"}
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
                          <DropdownMenuItem onClick={() => handleSuspend(leader.id)}>
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
                          onClick={() => handleDelete(leader.id)}
                          className="text-red-500"
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
    </div>
  )
}
