"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  Mail, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Send,
  Eye,
  Users,
  MailOpen,
  FileText
} from "lucide-react"
import { PageHeader, ConfirmDialog } from "@/components/shared"
import { TableSkeleton, StatCardSkeleton } from "@/components/skeletons"
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
  useNewsletters, 
  useNewsletterStats,
  useDeleteNewsletter,
  useSendNewsletter,
  type Newsletter 
} from "@/lib/hooks"
import { formatDate, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"

export default function NewslettersPage() {
  const { data: newsletters, isLoading } = useNewsletters()
  const { data: stats, isLoading: statsLoading } = useNewsletterStats()
  const deleteNewsletter = useDeleteNewsletter()
  const sendNewsletter = useSendNewsletter()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null)

  const handleDeleteClick = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedNewsletter) return
    try {
      await deleteNewsletter.mutateAsync(selectedNewsletter.id)
      toast.success("Newsletter deleted")
    } catch {
      toast.error("Failed to delete newsletter")
    }
    setSelectedNewsletter(null)
  }

  const handleSendClick = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter)
    setSendDialogOpen(true)
  }

  const handleSendConfirm = async () => {
    if (!selectedNewsletter) return
    try {
      await sendNewsletter.mutateAsync(selectedNewsletter.id)
      toast.success("Newsletter sent to all subscribers!")
    } catch {
      toast.error("Failed to send newsletter")
    }
    setSelectedNewsletter(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Draft</Badge>
      case "Sending":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Sending</Badge>
      case "Sent":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Sent</Badge>
      case "Failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletters"
        description="Create and send email newsletters to your members"
      >
        <Button asChild>
          <Link href="/dashboard/newsletters/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Newsletter
          </Link>
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
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.totalNewsletters || 0}</p>
                  <p className="text-xs text-zinc-500">Total Newsletters</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.draftCount || 0}</p>
                  <p className="text-xs text-zinc-500">Drafts</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.totalRecipients || 0}</p>
                  <p className="text-xs text-zinc-500">Total Recipients</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-white/5 rounded-lg bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MailOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{stats?.totalOpens || 0}</p>
                  <p className="text-xs text-zinc-500">Total Opens</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : newsletters?.length === 0 ? (
        <div className="text-center py-12 border border-white/5 rounded-lg bg-zinc-900/30">
          <Mail className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No newsletters yet</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Create your first newsletter to start engaging with your members
          </p>
          <Button asChild>
            <Link href="/dashboard/newsletters/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Newsletter
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500">Title</TableHead>
                <TableHead className="text-zinc-500">Subject</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Recipients</TableHead>
                <TableHead className="text-zinc-500">Created</TableHead>
                <TableHead className="text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters?.map((newsletter) => (
                <TableRow key={newsletter.id} className="border-white/5">
                  <TableCell>
                    <p className="font-medium text-zinc-200">{newsletter.title}</p>
                  </TableCell>
                  <TableCell className="text-zinc-400 max-w-xs truncate">
                    {newsletter.subject}
                  </TableCell>
                  <TableCell>{getStatusBadge(newsletter.status)}</TableCell>
                  <TableCell className="text-zinc-400">
                    {newsletter.status === "Sent" ? newsletter.recipientCount : "-"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {newsletter.sentAt 
                      ? formatDateTime(newsletter.sentAt)
                      : formatDate(newsletter.createdAt)
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {newsletter.status === "Draft" && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={"/dashboard/newsletters/" + newsletter.id}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={"/dashboard/newsletters/" + newsletter.id + "/preview"}>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSendClick(newsletter)}>
                              <Send className="w-4 h-4 mr-2" />
                              Send Now
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(newsletter)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {newsletter.status === "Sent" && (
                          <DropdownMenuItem asChild>
                            <Link href={"/dashboard/newsletters/" + newsletter.id + "/preview"}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
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
        title="Delete Newsletter"
        description={"Are you sure you want to delete \"" + (selectedNewsletter?.title || "") + "\"? This action cannot be undone."}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Send Newsletter"
        description={"Are you sure you want to send \"" + (selectedNewsletter?.title || "") + "\" to all subscribed members? This action cannot be undone."}
        confirmText="Send Now"
        onConfirm={handleSendConfirm}
      />
    </div>
  )
}
