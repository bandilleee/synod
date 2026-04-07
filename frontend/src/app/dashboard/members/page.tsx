"use client"

import { useState } from "react"
import { 
  Users, 
  Search, 
  Download, 
  MoreHorizontal, 
  Trash2, 
  Mail,
  RefreshCw,
  UserCheck,
  UserX,
  TrendingUp
} from "lucide-react"
import { PageHeader, ConfirmDialog } from "@/components/shared"
import { TableSkeleton, StatCardSkeleton } from "@/components/skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMembers, useMemberStats, useDeleteMember, useResubscribeMember, useExportMembers, type Member } from "@/lib/hooks"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function MembersPage() {
  const [search, setSearch] = useState("")
  const [subscribed, setSubscribed] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

  const { data: membersData, isLoading: membersLoading } = useMembers(search, subscribed, page, pageSize)
  const { data: stats, isLoading: statsLoading } = useMemberStats()
  const deleteMember = useDeleteMember()
  const resubscribeMember = useResubscribeMember()
  const exportMembers = useExportMembers()

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return
    try {
      await deleteMember.mutateAsync(memberToDelete.id)
      toast.success("Member deleted")
    } catch {
      toast.error("Failed to delete member")
    }
    setMemberToDelete(null)
  }

  const handleResubscribe = async (id: string) => {
    try {
      await resubscribeMember.mutateAsync(id)
      toast.success("Member resubscribed")
    } catch {
      toast.error("Failed to resubscribe member")
    }
  }

  const handleExport = async () => {
    try {
      let members: Member[] = []

      if (subscribed === undefined) {
        const [subscribedMembers, unsubscribedMembers] = await Promise.all([
          exportMembers.mutateAsync(true),
          exportMembers.mutateAsync(false),
        ])
        members = [...subscribedMembers, ...unsubscribedMembers]
      } else {
        members = await exportMembers.mutateAsync(subscribed)
      }
      
      const headers = ["Email", "Name", "Phone", "Subscribed", "Source Form", "Created"]
      const rows = members.map(m => [
        m.email,
        m.name || "",
        m.phone || "",
        m.isSubscribed ? "Yes" : "No",
        m.sourceFormName || "",
        formatDate(m.createdAt)
      ])
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")
      
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "members-export-" + new Date().toISOString().split("T")[0] + ".csv"
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success("Export downloaded")
    } catch {
      toast.error("Failed to export members")
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (value: string) => {
    if (value === "all") setSubscribed(undefined)
    else if (value === "subscribed") setSubscribed(true)
    else setSubscribed(false)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage your member database"
      >
        <Button onClick={handleExport} disabled={exportMembers.isPending}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.totalMembers || 0}</p>
                  <p className="text-xs text-zinc-500">Total Members</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.subscribedMembers || 0}</p>
                  <p className="text-xs text-zinc-500">Subscribed</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <UserX className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.unsubscribedMembers || 0}</p>
                  <p className="text-xs text-zinc-500">Unsubscribed</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.newThisMonth || 0}</p>
                  <p className="text-xs text-zinc-500">New This Month</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search by email, name, or phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800"
          />
        </div>
        <Select onValueChange={handleFilterChange} defaultValue="all">
          <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-800">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="subscribed">Subscribed</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {membersLoading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : membersData?.members.length === 0 ? (
        <div className="text-center py-12 border border-white/5 rounded-lg bg-zinc-900/30">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No members found</h3>
          <p className="text-sm text-zinc-500">
            {search ? "Try a different search term" : "Members will appear here when they submit forms"}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500">Email</TableHead>
                  <TableHead className="text-zinc-500">Name</TableHead>
                  <TableHead className="text-zinc-500">Status</TableHead>
                  <TableHead className="text-zinc-500">Source</TableHead>
                  <TableHead className="text-zinc-500">Joined</TableHead>
                  <TableHead className="text-zinc-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersData?.members.map((member) => (
                  <TableRow key={member.id} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-200">{member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">{member.name || "-"}</TableCell>
                    <TableCell>
                      {member.isSubscribed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Subscribed
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                          Unsubscribed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400">{member.sourceFormName || "-"}</TableCell>
                    <TableCell className="text-zinc-400">{formatDate(member.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!member.isSubscribed && (
                            <DropdownMenuItem onClick={() => handleResubscribe(member.id)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Resubscribe
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(member)}
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

          {/* Pagination */}
          {membersData && membersData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, membersData.totalCount)} of {membersData.totalCount} members
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
                  onClick={() => setPage(p => Math.min(membersData.totalPages, p + 1))}
                  disabled={page === membersData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Member"
        description={`Are you sure you want to delete "${memberToDelete?.email ?? "this member"}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
