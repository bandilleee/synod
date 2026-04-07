"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEvent, useUpdateEvent } from "@/lib/hooks"
import { toast } from "sonner"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: event, isLoading } = useEvent(id)
  const updateEvent = useUpdateEvent()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")

  // Load event data
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setLocation(event.location || "")
      
      // Parse date and time
      const startDate = new Date(event.date)
      setDate(startDate.toISOString().split("T")[0])
      setTime(startDate.toTimeString().slice(0, 5))
      
      if (event.endDate) {
        const end = new Date(event.endDate)
        setEndDate(end.toISOString().split("T")[0])
        setEndTime(end.toTimeString().slice(0, 5))
      }
    }
  }, [event])

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
      await updateEvent.mutateAsync({
        id,
        data: {
          title,
          description: description || undefined,
          date: startDateTime,
          endDate: endDateTime,
          location: location || undefined,
        },
      })
      
      if (event?.status === "Approved") {
        toast.success("Event updated! All approvers have been notified.")
      } else {
        toast.success("Event updated!")
      }
      
      router.push("/dashboard/events/" + id)
    } catch {
      toast.error("Failed to update event")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-2">Event not found</h2>
        <Button asChild>
          <Link href="/dashboard/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  // Can only edit pending or approved events
  if (event.status === "Completed" || event.status === "Cancelled" || event.status === "Rejected") {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-2">Cannot edit this event</h2>
        <p className="text-zinc-400 mb-4">This event is {event.status.toLowerCase()} and cannot be edited.</p>
        <Button asChild>
          <Link href="/dashboard/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={"/dashboard/events/" + id}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Edit Event"
        description={"Editing: " + event.title}
      >
        <Button onClick={handleSubmit} disabled={updateEvent.isPending}>
          {updateEvent.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </PageHeader>

      {event.status === "Approved" && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            <strong>Note:</strong> This event has already been approved. 
            Saving changes will notify all approvers about the update.
          </p>
        </div>
      )}

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
      </div>
    </div>
  )
}