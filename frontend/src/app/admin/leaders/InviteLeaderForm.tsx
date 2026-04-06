"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrganizations, useCreateInvitation } from "@/lib/hooks"
import { useState } from "react"

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  organizationId: z.string().min(1, "Please select an organization"),
})

type InviteForm = z.infer<typeof inviteSchema>

interface InviteLeaderFormProps {
  onSuccess: () => void
}

export function InviteLeaderForm({ onSuccess }: InviteLeaderFormProps) {
  const { data: organizations } = useOrganizations()
  const createInvitation = useCreateInvitation()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = async (data: InviteForm) => {
    setError(null)
    try {
      await createInvitation.mutateAsync(data)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send invitation")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="leader@example.com"
          {...register("email")}
          className="bg-zinc-800 border-zinc-700"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizationId">Organization</Label>
        <Select onValueChange={(value) => setValue("organizationId", value)}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.organizationId && (
          <p className="text-sm text-red-500">{errors.organizationId.message}</p>
        )}
        {organizations?.length === 0 && (
          <p className="text-sm text-yellow-500">
            No organizations available. Please create an organization first.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting || organizations?.length === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Invitation"
          )}
        </Button>
      </div>
    </form>
  )
}
