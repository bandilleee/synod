"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateEvent } from "@/lib/hooks"
import { toast } from "sonner"

export default function NewEventPage() {
  const router = useRouter()
  const createEvent = useCreateEvent()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter an event title")
      return
    }
    if (!date || !time) {
      toast.error("Please select a date and time")
      return
    }

    const startDateTime = new Date(date + "T" + time).toISOString()
    const endDateTime = endDate && endTime 
      ? new Date(endDate + "T" + endTime).toISOString() 
      : undefined

    try {
      const event = await createEvent.mutateAsync({
        title,
        description: description || undefined,
        date: startDateTime,
        endDate: endDateTime,
        location: location || undefined,
      })
      toast.success("Event proposed! Waiting for approvals.")
      router.push("/dashboard/events/" + event.id)
    } catch {
      toast.error("Failed to create event")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Propose Event"
        description="Create a new event for team approval"
      >
        <Button onClick={handleSubmit} disabled={createEvent.isPending}>
          {createEvent.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Submit for Approval
        </Button>
      </PageHeader>

      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            placeholder="Team Meeting, Workshop, Conference..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is this event about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800 resize-none"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Start Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Start Time *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time (optional)</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Conference Room A, Online, 123 Main St..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800"
          />
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Note:</strong> Once submitted, all other leaders will be notified and asked to approve this event. 
            The event will only be confirmed when all leaders have approved.
          </p>
        </div>
      </div>
    </div>
  )
}
