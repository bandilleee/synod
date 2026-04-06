"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Monitor, Smartphone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNewsletter, useNewsletterPreview } from "@/lib/hooks"

export default function NewsletterPreviewPage() {
  const params = useParams()
  const id = params.id as string

  const { data: newsletter, isLoading: newsletterLoading } = useNewsletter(id)
  const { data: previewHtml, isLoading: previewLoading } = useNewsletterPreview(id)

  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")

  const isLoading = newsletterLoading || previewLoading

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={"/dashboard/newsletters/" + id}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Link>
        </Button>

        <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1 border border-white/10">
          <Button
            variant={viewMode === "desktop" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={viewMode === "mobile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white mb-2">Preview: {newsletter.title}</h1>
        <p className="text-zinc-500">Subject: {newsletter.subject}</p>
      </div>

      <div className="flex justify-center">
        <div 
          className={
            viewMode === "desktop" 
              ? "w-full max-w-3xl" 
              : "w-full max-w-sm"
          }
        >
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Email Client Header Mockup */}
            <div className="bg-zinc-100 px-4 py-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-sm text-zinc-600">
                <p><strong>From:</strong> Synod &lt;noreply@synod.app&gt;</p>
                <p><strong>Subject:</strong> {newsletter.subject}</p>
              </div>
            </div>

            {/* Email Content */}
            <iframe
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ 
                height: viewMode === "desktop" ? "800px" : "600px",
                backgroundColor: "white"
              }}
              title="Newsletter Preview"
            />
          </div>
        </div>
      </div>
    </div>
  )
}