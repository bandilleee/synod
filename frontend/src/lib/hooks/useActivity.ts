import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export interface Activity {
  id: string
  action: string
  actionDisplay: string
  entityType: string
  entityId?: string
  entityName?: string
  userId?: string
  userName?: string
  details?: string
  createdAt: string
}

export interface ActivityList {
  activities: Activity[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export function useActivities(page = 1, pageSize = 20, action?: string, userId?: string) {
  return useQuery({
    queryKey: ["activities", page, pageSize, action, userId],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("pageSize", pageSize.toString())
      if (action) params.append("action", action)
      if (userId) params.append("userId", userId)
      
      const response = await api.get("/activity?" + params.toString())
      return response.data.data as ActivityList
    },
  })
}

export function useMyActivities(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["my-activities", page, pageSize],
    queryFn: async () => {
      const response = await api.get("/activity/my?page=" + page + "&pageSize=" + pageSize)
      return response.data.data as ActivityList
    },
  })
}
