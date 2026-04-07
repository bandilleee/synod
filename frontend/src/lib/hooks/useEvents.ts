import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

// Types
export interface Event {
  id: string
  title: string
  description?: string
  date: string
  endDate?: string
  location?: string
  status: string
  requiredApprovals: number
  currentApprovals: number
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface EventApproval {
  id: string
  userId: string
  userName: string
  status: string
  comment?: string
  respondedAt?: string
  createdAt: string
}

export interface EventDetail extends Event {
  approvals: EventApproval[]
}

interface CreateEventData {
  title: string
  description?: string
  date: string
  endDate?: string
  location?: string
}

interface UpdateEventData {
  title?: string
  description?: string
  date?: string
  endDate?: string
  location?: string
}

interface ApprovalData {
  comment?: string
}

// API functions
const getEvents = async (): Promise<Event[]> => {
  const response = await api.get("/events")
  return response.data.data
}

const getPendingApprovals = async (): Promise<Event[]> => {
  const response = await api.get("/events/pending")
  return response.data.data
}

const getEvent = async (id: string): Promise<EventDetail> => {
  const response = await api.get("/events/" + id)
  return response.data.data
}

const createEvent = async (data: CreateEventData): Promise<Event> => {
  const response = await api.post("/events", data)
  return response.data.data
}

const updateEvent = async ({ id, data }: { id: string; data: UpdateEventData }): Promise<Event> => {
  const response = await api.put("/events/" + id, data)
  return response.data.data
}

const deleteEvent = async (id: string): Promise<void> => {
  await api.delete("/events/" + id)
}

const approveEvent = async ({ id, data }: { id: string; data?: ApprovalData }): Promise<void> => {
  await api.post("/events/" + id + "/approve", data || {})
}

const rejectEvent = async ({ id, data }: { id: string; data?: ApprovalData }): Promise<void> => {
  await api.post("/events/" + id + "/reject", data || {})
}

const cancelEvent = async (id: string): Promise<void> => {
  await api.post("/events/" + id + "/cancel")
}

// Hooks
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  })
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["events", "pending"],
    queryFn: getPendingApprovals,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => getEvent(id),
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useApproveEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["events", "pending"] })
    },
  })
}

export function useRejectEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["events", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["events", "pending"] })
    },
  })
}

export function useCancelEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}
