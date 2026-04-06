"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { NewsletterEditor } from "@/components/newsletter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateNewsletter } from "@/lib/hooks"
import { toast } from "sonner"

export default function NewNewsletterPage() {
  const router = useRouter()
  const createNewsletter = useCreateNewsletter()

  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [contentJson, setContentJson] = useState("")

  const handleEditorChange = (json: string) => {
    setContentJson(json)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject line")
      return
    }

    try {
      const newsletter = await createNewsletter.mutateAsync({
        title,
        subject,
        previewText: previewText || undefined,
        contentJson: contentJson || undefined,
      })
      toast.success("Newsletter created")
      router.push("/dashboard/newsletters/" + newsletter.id)
    } catch {
      toast.error("Failed to create newsletter")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/newsletters">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Newsletters
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Create Newsletter"
        description="Compose a new newsletter to send to your members"
      >
        <Button onClick={handleSave} disabled={createNewsletter.isPending}>
          {createNewsletter.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Draft
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {/* Title (internal) */}
        <div className="space-y-2">
          <Label htmlFor="title">Title (internal only)</Label>
          <Input
            id="title"
            placeholder="April Newsletter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800"
          />
          <p className="text-xs text-zinc-500">This title is for your reference only and won't be seen by recipients.</p>
        </div>

        {/* Subject Line */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            placeholder="Your April Newsletter is Here! 🎉"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800"
          />
          <p className="text-xs text-zinc-500">This is what recipients will see in their inbox.</p>
        </div>

        {/* Preview Text */}
        <div className="space-y-2">
          <Label htmlFor="preview">Preview Text (optional)</Label>
          <Textarea
            id="preview"
            placeholder="Check out what's happening this month..."
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800 resize-none"
            rows={2}
          />
          <p className="text-xs text-zinc-500">This text appears after the subject line in email clients.</p>
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label>Content</Label>
          <NewsletterEditor
            onChange={handleEditorChange}
            placeholder="Start writing your newsletter..."
          />
        </div>
      </div>
    </div>
  )
}
