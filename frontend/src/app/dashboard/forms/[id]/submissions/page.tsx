"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { TableSkeleton } from "@/components/skeletons"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useForm, useFormSubmissions, type FormField } from "@/lib/hooks"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"

export default function FormSubmissionsPage() {
  const params = useParams()
  const formId = params.id as string
  
  const { data: form, isLoading: formLoading } = useForm(formId)
  const { data: submissionsData, isLoading: submissionsLoading } = useFormSubmissions(formId)

  const isLoading = formLoading || submissionsLoading

  // Parse form fields to get labels
  const getFormFields = (): FormField[] => {
    if (!form?.fieldsJson) return []
    try {
      return JSON.parse(form.fieldsJson)
    } catch {
      return []
    }
  }

  const formFields = getFormFields()

  // Create a map of field ID to label
  const fieldLabelMap = formFields.reduce((acc, field) => {
    acc[field.id] = field.label
    return acc
  }, {} as Record<string, string>)

  const parseSubmissionData = (dataJson: string) => {
    try {
      return JSON.parse(dataJson)
    } catch {
      return {}
    }
  }

  const handleExport = () => {
    if (!submissionsData?.submissions?.length) return

    // Use field labels for headers
    const headers = ["Submitted At", ...formFields.map(f => f.label)]
    
    const rows = submissionsData.submissions.map(sub => {
      const data = parseSubmissionData(sub.dataJson)
      return [
        formatDateTime(sub.createdAt),
        ...formFields.map(f => String(data[f.id] || ""))
      ]
    })

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${form?.slug || "form"}-submissions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success("Export downloaded")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/forms">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forms
          </Link>
        </Button>
      </div>

      <PageHeader
        title={form?.title ? `${form.title} - Submissions` : "Form Submissions"}
        description={`${submissionsData?.totalCount || 0} total submissions`}
      >
        <Button onClick={handleExport} disabled={!submissionsData?.submissions?.length}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

      {isLoading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : submissionsData?.submissions?.length === 0 ? (
        <div className="text-center py-12 border border-white/5 rounded-lg bg-zinc-900/30">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No submissions yet</h3>
          <p className="text-sm text-zinc-500">
            Submissions will appear here when people fill out your form
          </p>
        </div>
      ) : (
        <div className="border border-white/5 rounded-lg bg-zinc-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-500">Submitted</TableHead>
                  {formFields.slice(0, 5).map(field => (
                    <TableHead key={field.id} className="text-zinc-500">
                      {field.label}
                    </TableHead>
                  ))}
                  {formFields.length > 5 && (
                    <TableHead className="text-zinc-500">+{formFields.length - 5} more</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionsData?.submissions?.map((submission) => {
                  const data = parseSubmissionData(submission.dataJson)
                  return (
                    <TableRow key={submission.id} className="border-white/5">
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {formatDateTime(submission.createdAt)}
                      </TableCell>
                      {formFields.slice(0, 5).map(field => (
                        <TableCell key={field.id} className="text-zinc-300 max-w-xs truncate">
                          {String(data[field.id] || "-")}
                        </TableCell>
                      ))}
                      {formFields.length > 5 && (
                        <TableCell className="text-zinc-500">...</TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}