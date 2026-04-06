"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Eye, Send, Mail } from "lucide-react"
import { PageHeader, ConfirmDialog } from "@/components/shared"
import { NewsletterEditor } from "@/components/newsletter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  useNewsletter, 
  useUpdateNewsletter, 
  useSendTestEmail,
  useSendNewsletter 
} from "@/lib/hooks"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function EditNewsletterPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: newsletter, isLoading } = useNewsletter(id)
  const updateNewsletter = useUpdateNewsletter()
  const sendTestEmail = useSendTestEmail()
  const sendNewsletter = useSendNewsletter()

  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [contentJson, setContentJson] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  // Load newsletter data
  useEffect(() => {
    if (newsletter) {
      setTitle(newsletter.title)
      setSubject(newsletter.subject)
      setPreviewText(newsletter.previewText || "")
      setContentJson(newsletter.contentJson || "")
    }
  }, [newsletter])

  const handleEditorChange = (json: string) => {
    setContentJson(json)
    setHasChanges(true)
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
      await updateNewsletter.mutateAsync({
        id,
        data: {
          title,
          subject,
          previewText: previewText || undefined,
          contentJson: contentJson || undefined,
        },
      })
      toast.success("Newsletter saved")
      setHasChanges(false)
    } catch {
      toast.error("Failed to save newsletter")
    }
  }

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }

    // Save first if there are changes
    if (hasChanges) {
      await handleSave()
    }

    try {
      await sendTestEmail.mutateAsync({ id, email: testEmail })
      toast.success("Test email sent to " + testEmail)
      setTestEmailDialogOpen(false)
      setTestEmail("")
    } catch {
      toast.error("Failed to send test email")
    }
  }

  const handleSend = async () => {
    // Save first if there are changes
    if (hasChanges) {
      await handleSave()
    }

    try {
      await sendNewsletter.mutateAsync(id)
      toast.success("Newsletter sent to all subscribers!")
      setSendDialogOpen(false)
      router.push("/dashboard/newsletters")
    } catch {
      toast.error("Failed to send newsletter")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-2">Newsletter not found</h2>
        <Button asChild>
          <Link href="/dashboard/newsletters">Back to Newsletters</Link>
        </Button>
      </div>
    )
  }

  const isSent = newsletter.status === "Sent"

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
        title={isSent ? "View Newsletter" : "Edit Newsletter"}
        description={isSent ? "This newsletter has been sent" : "Edit your newsletter draft"}
      >
        <div className="flex gap-2">
          {!isSent && (
            <>
              <Button variant="outline" asChild>
                <Link href={"/dashboard/newsletters/" + id + "/preview"}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setTestEmailDialogOpen(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Send Test
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSave} 
                disabled={updateNewsletter.isPending || !hasChanges}
              >
                {updateNewsletter.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button onClick={() => setSendDialogOpen(true)}>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6">
        {/* Title (internal) */}
        <div className="space-y-2">
          <Label htmlFor="title">Title (internal only)</Label>
          <Input
            id="title"
            placeholder="April Newsletter"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true) }}
            className="bg-zinc-900/50 border-zinc-800"
            disabled={isSent}
          />
        </div>

        {/* Subject Line */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            placeholder="Your April Newsletter is Here! 🎉"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setHasChanges(true) }}
            className="bg-zinc-900/50 border-zinc-800"
            disabled={isSent}
          />
        </div>

        {/* Preview Text */}
        <div className="space-y-2">
          <Label htmlFor="preview">Preview Text (optional)</Label>
          <Textarea
            id="preview"
            placeholder="Check out what's happening this month..."
            value={previewText}
            onChange={(e) => { setPreviewText(e.target.value); setHasChanges(true) }}
            className="bg-zinc-900/50 border-zinc-800 resize-none"
            rows={2}
            disabled={isSent}
          />
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label>Content</Label>
          {isSent ? (
            <div 
              className="border border-white/10 rounded-lg bg-zinc-900/50 p-4 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: newsletter.htmlContent || "" }}
            />
          ) : (
            <NewsletterEditor
              content={contentJson}
              onChange={handleEditorChange}
              placeholder="Start writing your newsletter..."
            />
          )}
        </div>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Send Test Email</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send a test email to preview how your newsletter will look.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={sendTestEmail.isPending}>
              {sendTestEmail.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <ConfirmDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        title="Send Newsletter"
        description="Are you sure you want to send this newsletter to all subscribed members? This action cannot be undone."
        confirmText="Send Now"
        onConfirm={handleSend}
      />
    </div>
  )
}