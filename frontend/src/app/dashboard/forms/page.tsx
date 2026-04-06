"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, ExternalLink, Copy, Archive } from "lucide-react"
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
import { useForms, useDeleteForm, usePublishForm, useCloseForm, type Form } from "@/lib/hooks"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function FormsPage() {
  const { data: forms, isLoading } = useForms()
  const deleteForm = useDeleteForm()
  const publishForm = usePublishForm()
  const closeForm = useCloseForm()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<Form | null>(null)

  const handleDeleteClick = (form: Form) => {
    setFormToDelete(form)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return
    try {
      await deleteForm.mutateAsync(formToDelete.id)
      toast.success("Form deleted")
    } catch {
      toast.error("Failed to delete form")
    }
    setFormToDelete(null)
  }

  const handlePublish = async (id: string) => {
    try {
      await publishForm.mutateAsync(id)
      toast.success("Form published")
    } catch {
      toast.error("Failed to publish form")
    }
  }

  const handleClose = async (id: string) => {
    try {
      await closeForm.mutateAsync(id)
      toast.success("Form closed")
    } catch {
      toast.error("Failed to close form")
    }
  }

  const copyFormLink = (slug: string) => {
    const url = window.location.origin + "/f/" + slug
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
      case "Draft":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Draft</Badge>
      case "Closed":
        return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Closed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div>
      <PageHeader
        title="Forms"
        description="Create and manage data collection forms"
      >
        <Button asChild>
          <Link href="/dashboard/forms/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : forms?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms yet"
          description="Create your first form to start collecting data"
          action={
            <Button asChild>
              <Link href="/dashboard/forms/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500">Title</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Submissions</TableHead>
                <TableHead className="text-zinc-500">Created</TableHead>
                <TableHead className="text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms?.map((form) => (
                <TableRow key={form.id} className="border-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{form.title}</p>
                      <p className="text-xs text-zinc-500">/{form.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(form.status)}</TableCell>
                  <TableCell className="text-zinc-400">{form.submissionCount}</TableCell>
                  <TableCell className="text-zinc-400">{formatDate(form.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={"/dashboard/forms/" + form.id}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={"/dashboard/forms/" + form.id + "/submissions"}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Submissions ({form.submissionCount})
                          </Link>
                        </DropdownMenuItem>
                        {form.status === "Active" && (
                          <>
                            <DropdownMenuItem onClick={() => copyFormLink(form.slug)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={"/f/" + form.slug} target="_blank">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Form
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        {form.status === "Draft" && (
                          <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {form.status === "Active" && (
                          <DropdownMenuItem onClick={() => handleClose(form.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Close
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(form)}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Form"
        description={`Are you sure you want to delete "${formToDelete?.title ?? ""}"? This will also delete all submissions. This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
