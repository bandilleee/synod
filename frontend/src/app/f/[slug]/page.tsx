"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePublicForm, useSubmitForm, type FormField } from "@/lib/hooks"
import { LoadingScreen } from "@/components/shared"

const isValidEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

export default function PublicFormPage() {
  const params = useParams()
  const slug = params.slug as string
  const { data: formData, isLoading: formLoading } = usePublicForm(slug)
  const submitForm = useSubmitForm()
  
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm()

  if (formLoading) {
    return <LoadingScreen />
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Form Not Found</h2>
              <p className="text-zinc-400 text-sm">
                This form does not exist or is no longer accepting submissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fields: FormField[] = JSON.parse(formData.fieldsJson || "[]")

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await submitForm.mutateAsync({ slug, data })
      setSuccessMessage(formData.successMessage || "Thank you for your submission!")
      setSubmitted(true)

      if (formData.redirectUrl) {
        setTimeout(() => {
          window.location.href = formData.redirectUrl!
        }, 2000)
      }
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to submit form"
          : "Failed to submit form"
      alert(message)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Submitted!</h2>
              <p className="text-zinc-400 text-sm">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{formData.title}</CardTitle>
            {formData.description && (
              <CardDescription>{formData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      {...register(field.id, { required: field.required })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  ) : field.type === "select" ? (
                    <Select onValueChange={(value) => setValue(field.id, value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder={field.placeholder || "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "radio" ? (
                    <div className="space-y-2">
                      {field.options?.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={field.id + "-" + option.value}
                            value={option.value}
                            {...register(field.id, { required: field.required })}
                            className="text-white"
                          />
                          <label htmlFor={field.id + "-" + option.value} className="text-zinc-300">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : field.type === "checkbox" ? (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={field.id}
                        onCheckedChange={(checked) => setValue(field.id, checked)}
                      />
                      <label htmlFor={field.id} className="text-zinc-300 text-sm">
                        {field.placeholder || field.label}
                      </label>
                    </div>
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      {...register(field.id, { 
                        required: field.required ? "This field is required" : false,
                        validate: field.type === "email" 
                          ? (value) => !value || isValidEmail(value) || "Please enter a valid email address (e.g. name@example.com)" 
                          : undefined
                      })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  )}
                  
                  {field.helpText && (
                    <p className="text-xs text-zinc-500">{field.helpText}</p>
                  )}
                  {errors[field.id] && (
                    <p className="text-sm text-red-500">
                      {errors[field.id]?.message?.toString() || "This field is required"}
                    </p>
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-zinc-600 text-xs mt-8">
          Powered by Synod
        </p>
      </div>
    </div>
  )
}