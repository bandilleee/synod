import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Member {
  id: string
  email: string
  name?: string
  phone?: string
  metadataJson?: string
  isSubscribed: boolean
  unsubscribedAt?: string
  sourceFormName?: string
  submissionCount: number
  createdAt: string
  updatedAt: string
}

export interface MemberList {
  members: Member[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MemberStats {
  totalMembers: number
  subscribedMembers: number
  unsubscribedMembers: number
  newThisMonth: number
}

export function useMembers(search?: string, subscribed?: boolean, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["members", search, subscribed, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (subscribed !== undefined) params.append("subscribed", String(subscribed))
      params.append("page", String(page))
      params.append("pageSize", String(pageSize))
      
      const response = await api.get("/members?" + params.toString())
      return response.data.data as MemberList
    },
  })
}

export function useMemberStats() {
  return useQuery({
    queryKey: ["members", "stats"],
    queryFn: async () => {
      const response = await api.get("/members/stats")
      return response.data.data as MemberStats
    },
  })
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ["members", id],
    queryFn: async () => {
      const response = await api.get("/members/" + id)
      return response.data.data as Member
    },
    enabled: !!id,
  })
}

export function useResubscribeMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post("/members/" + id + "/resubscribe")
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete("/members/" + id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })
}

export function useExportMembers() {
  return useMutation<Member[], Error, boolean>({
    mutationFn: async (subscribedOnly = true) => {
      const response = await api.get("/members/export?subscribedOnly=" + subscribedOnly)
      return response.data.data as Member[]
    },
  })
}
