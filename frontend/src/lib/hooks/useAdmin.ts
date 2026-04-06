import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Organization, User } from "@/types"

interface AdminStats {
  totalLeaders: number
  totalOrganizations: number
  totalMembers: number
  totalEvents: number
  pendingInvitations: number
  pendingEventApprovals: number
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  acceptedAt?: string
  organizationId: string
  organizationName: string
  invitedByName: string
  createdAt: string
}

// Stats
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get("/admin/stats")
      return response.data.data as AdminStats
    },
  })
}

// Leaders
export function useLeaders() {
  return useQuery({
    queryKey: ["admin", "leaders"],
    queryFn: async () => {
      const response = await api.get("/admin/leaders")
      return response.data.data as User[]
    },
  })
}

export function useSuspendLeader() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post("/admin/leaders/" + id + "/suspend")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaders"] })
    },
  })
}

export function useReactivateLeader() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post("/admin/leaders/" + id + "/reactivate")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaders"] })
    },
  })
}

export function useDeleteLeader() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete("/admin/leaders/" + id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "leaders"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
  })
}

// Organizations
export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const response = await api.get("/organizations")
      return response.data.data as Organization[]
    },
  })
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["organizations", id],
    queryFn: async () => {
      const response = await api.get("/organizations/" + id)
      return response.data.data
    },
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; type: string; description?: string }) => {
      const response = await api.post("/organizations", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string; isActive: boolean } }) => {
      const response = await api.put("/organizations/" + id, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete("/organizations/" + id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
  })
}

// Invitations
export function useInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const response = await api.get("/invitations")
      return response.data.data as Invitation[]
    },
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; organizationId: string }) => {
      const response = await api.post("/invitations", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post("/invitations/" + id + "/revoke")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post("/invitations/" + id + "/resend")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] })
    },
  })
}
