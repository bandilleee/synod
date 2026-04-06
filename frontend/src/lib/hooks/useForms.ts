import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  options?: { label: string; value: string }[]
}

export interface Form {
  id: string
  title: string
  description?: string
  slug: string
  status: string
  submissionCount: number
  successMessage?: string
  redirectUrl?: string
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface FormDetail extends Form {
  fieldsJson: string
  settingsJson?: string
}

export interface FormSubmission {
  id: string
  dataJson: string
  ipAddress?: string
  createdAt: string
  memberId?: string
  memberEmail?: string
}

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const response = await api.get("/forms")
      return response.data.data as Form[]
    },
  })
}

export function useForm(id: string) {
  return useQuery({
    queryKey: ["forms", id],
    queryFn: async () => {
      const response = await api.get("/forms/" + id)
      return response.data.data as FormDetail
    },
    enabled: !!id,
  })
}

export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: ["public-forms", slug],
    queryFn: async () => {
      const response = await api.get("/public/forms/" + slug)
      return response.data.data as FormDetail
    },
    enabled: !!slug,
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      title: string
      slug: string
      description?: string
      fieldsJson: string
      successMessage?: string
      redirectUrl?: string
    }) => {
      const payload = {
        title: data.title,
        slug: data.slug,
        description: data.description || "",
        fieldsJson: data.fieldsJson,
        settingsJson: JSON.stringify({
          successMessage: data.successMessage || "Thank you for your submission!",
          redirectUrl: data.redirectUrl || "",
        }),
        successMessage: data.successMessage || "Thank you for your submission!",
        redirectUrl: data.redirectUrl || "",
      }
      console.log("Creating form with payload:", payload)
      const response = await api.post("/forms", payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
    onError: (error: any) => {
      console.error("Create form error:", error.response?.data || error.message)
    },
  })
}

export function useUpdateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: {
        title: string
        description?: string
        fieldsJson: string
        successMessage?: string
        redirectUrl?: string
      }
    }) => {
      const payload = {
        title: data.title,
        description: data.description || "",
        fieldsJson: data.fieldsJson,
        settingsJson: JSON.stringify({
          successMessage: data.successMessage || "Thank you for your submission!",
          redirectUrl: data.redirectUrl || "",
        }),
        successMessage: data.successMessage || "Thank you for your submission!",
        redirectUrl: data.redirectUrl || "",
      }
      const response = await api.put("/forms/" + id, payload)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
      queryClient.invalidateQueries({ queryKey: ["forms", variables.id] })
    },
  })
}

export function usePublishForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post("/forms/" + id + "/publish")
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
  })
}

export function useCloseForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post("/forms/" + id + "/close")
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
  })
}

export function useDeleteForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete("/forms/" + id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] })
    },
  })
}

export function useFormSubmissions(formId: string) {
  return useQuery({
    queryKey: ["forms", formId, "submissions"],
    queryFn: async () => {
      const response = await api.get("/forms/" + formId + "/submissions")
      return response.data.data as { submissions: FormSubmission[]; totalCount: number }
    },
    enabled: !!formId,
  })
}

export function useSubmitForm() {
  return useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: Record<string, unknown> }) => {
      const response = await api.post("/public/forms/" + slug + "/submit", {
        dataJson: JSON.stringify(data),
      })
      return response.data.data
    },
  })
}
