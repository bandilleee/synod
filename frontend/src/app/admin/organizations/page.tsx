"use client"

import { useState } from "react"
import { Plus, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOrganizations, useDeleteOrganization } from "@/lib/hooks"
import { formatDate } from "@/lib/utils"
import { OrganizationForm } from "./OrganizationForm"

type Organization = NonNullable<ReturnType<typeof useOrganizations>["data"]>[number]

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = useOrganizations()
  const deleteOrganization = useDeleteOrganization()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this organization?")) {
      await deleteOrganization.mutateAsync(id)
    }
  }

  const getLeaderCount = (org: Organization) => {
    const withLeaderCount = org as Organization & { leaderCount?: number; leaders?: unknown[] }
    if (typeof withLeaderCount.leaderCount === "number") return withLeaderCount.leaderCount
    if (Array.isArray(withLeaderCount.leaders)) return withLeaderCount.leaders.length
    return 0
  }

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage chapters, clubs, and societies"
      >
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : organizations?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to get started"
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Organization
            </Button>
          }
        />
      ) : (
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500">Name</TableHead>
                <TableHead className="text-zinc-500">Type</TableHead>
                <TableHead className="text-zinc-500">Leaders</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Created</TableHead>
                <TableHead className="text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations?.map((org) => (
                <TableRow key={org.id} className="border-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{org.name}</p>
                      <p className="text-xs text-zinc-500">{org.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">{org.type}</TableCell>
                  <TableCell className="text-zinc-400">{getLeaderCount(org)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={org.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
                      }
                    >
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{formatDate(org.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingOrg(org)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(org.id)}
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create Organization</DialogTitle>
            <DialogDescription>Add a new organization to the platform</DialogDescription>
          </DialogHeader>
          <OrganizationForm onSuccess={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingOrg} onOpenChange={() => setEditingOrg(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Organization</DialogTitle>
            <DialogDescription>Update organization details</DialogDescription>
          </DialogHeader>
          {editingOrg && (
            <OrganizationForm
              organization={editingOrg}
              onSuccess={() => setEditingOrg(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
