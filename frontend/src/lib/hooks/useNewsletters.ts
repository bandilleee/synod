import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

// Types
export interface Newsletter {
  id: string
  title: string
  subject: string
  previewText?: string
  status: string
  recipientCount: number
  openCount: number
  clickCount: number
  sentAt?: string
  scheduledAt?: string
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface NewsletterDetail extends Newsletter {
  contentJson?: string
  htmlContent?: string
}

export interface NewsletterTemplate {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  contentJson: string
  sortOrder: number
}

export interface NewsletterStats {
  totalNewsletters: number
  draftCount: number
  sentCount: number
  totalRecipients: number
  totalOpens: number
}

interface CreateNewsletterData {
  title: string
  subject: string
  previewText?: string
  contentJson?: string
}

interface UpdateNewsletterData {
  title?: string
  subject?: string
  previewText?: string
  contentJson?: string
  htmlContent?: string
}

// API functions
const getNewsletters = async (): Promise<Newsletter[]> => {
  const response = await api.get("/newsletters")
  return response.data.data
}

const getNewsletter = async (id: string): Promise<NewsletterDetail> => {
  const response = await api.get("/newsletters/" + id)
  return response.data.data
}

const getNewsletterStats = async (): Promise<NewsletterStats> => {
  const response = await api.get("/newsletters/stats")
  return response.data.data
}

const getNewsletterTemplates = async (): Promise<NewsletterTemplate[]> => {
  const response = await api.get("/newsletters/templates")
  return response.data.data
}

const getNewsletterPreview = async (id: string): Promise<string> => {
  const response = await api.get("/newsletters/" + id + "/preview")
  return response.data.data.html
}

const createNewsletter = async (data: CreateNewsletterData): Promise<Newsletter> => {
  const response = await api.post("/newsletters", data)
  return response.data.data
}

const updateNewsletter = async ({ id, data }: { id: string; data: UpdateNewsletterData }): Promise<Newsletter> => {
  const response = await api.put("/newsletters/" + id, data)
  return response.data.data
}

const deleteNewsletter = async (id: string): Promise<void> => {
  await api.delete("/newsletters/" + id)
}

const sendTestEmail = async ({ id, email }: { id: string; email: string }): Promise<void> => {
  await api.post("/newsletters/" + id + "/send-test", { email })
}

const sendNewsletter = async (id: string): Promise<void> => {
  await api.post("/newsletters/" + id + "/send")
}

// Hooks
export function useNewsletters() {
  return useQuery({
    queryKey: ["newsletters"],
    queryFn: getNewsletters,
  })
}

export function useNewsletter(id: string) {
  return useQuery({
    queryKey: ["newsletters", id],
    queryFn: () => getNewsletter(id),
    enabled: !!id,
  })
}

export function useNewsletterStats() {
  return useQuery({
    queryKey: ["newsletters", "stats"],
    queryFn: getNewsletterStats,
  })
}

export function useNewsletterTemplates() {
  return useQuery({
    queryKey: ["newsletters", "templates"],
    queryFn: getNewsletterTemplates,
  })
}

export function useNewsletterPreview(id: string) {
  return useQuery({
    queryKey: ["newsletters", id, "preview"],
    queryFn: () => getNewsletterPreview(id),
    enabled: !!id,
  })
}

export function useCreateNewsletter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createNewsletter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] })
    },
  })
}

export function useUpdateNewsletter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateNewsletter,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] })
      queryClient.invalidateQueries({ queryKey: ["newsletters", variables.id] })
    },
  })
}

export function useDeleteNewsletter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNewsletter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] })
    },
  })
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: sendTestEmail,
  })
}

export function useSendNewsletter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendNewsletter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletters"] })
    },
  })
}

