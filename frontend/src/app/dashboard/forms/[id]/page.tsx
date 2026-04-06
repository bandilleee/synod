"use client"

import { useParams } from "next/navigation"
import { useForm } from "@/lib/hooks"
import { FormBuilder } from "../FormBuilder"
import { LoadingScreen } from "@/components/shared"

export default function EditFormPage() {
  const params = useParams()
  const id = params.id as string
  const { data: form, isLoading } = useForm(id)

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!form) {
    return <div className="text-center text-zinc-500 py-12">Form not found</div>
  }

  return <FormBuilder initialData={form} />
}