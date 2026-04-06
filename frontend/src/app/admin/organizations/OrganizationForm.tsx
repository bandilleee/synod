"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateOrganization, useUpdateOrganization } from "@/lib/hooks"

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  type: z.string().min(1, "Please select a type"),
  description: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isActive: z.boolean(),
})

interface OrganizationFormProps {
  organization?: {
    id: string
    name: string
    slug: string
    type: string
    description?: string
    isActive: boolean
  }
  onSuccess: () => void
}

export function OrganizationForm({ organization, onSuccess }: OrganizationFormProps) {
  const createOrganization = useCreateOrganization()
  const updateOrganization = useUpdateOrganization()
  const isEditing = !!organization

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: isEditing
      ? {
          name: organization.name,
          description: organization.description || "",
          isActive: organization.isActive,
        }
      : {
          name: "",
          slug: "",
          type: "",
          description: "",
        },
  })

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateOrganization.mutateAsync({
          id: organization.id,
          data: {
            name: data.name,
            description: data.description,
            isActive: data.isActive,
          },
        })
      } else {
        await createOrganization.mutateAsync(data)
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save organization:", error)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name")}
          onChange={(e) => {
            register("name").onChange(e)
            if (!isEditing) {
              setValue("slug", generateSlug(e.target.value))
            }
          }}
          className="bg-zinc-800 border-zinc-700"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message as string}</p>
        )}
      </div>

      {!isEditing && (
        <>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              className="bg-zinc-800 border-zinc-700"
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select onValueChange={(value) => setValue("type", value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chapter">Chapter</SelectItem>
                <SelectItem value="Club">Club</SelectItem>
                <SelectItem value="Society">Society</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message as string}</p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          {...register("description")}
          className="bg-zinc-800 border-zinc-700"
          rows={3}
        />
      </div>

      {isEditing && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="rounded border-zinc-700"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Organization"
          ) : (
            "Create Organization"
          )}
        </Button>
      </div>
    </form>
  )
}
