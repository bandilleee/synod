"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Plus, 
  Trash2,
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  Circle,
  CheckSquare,
  Calendar,
  Loader2,
  Save,
  Eye,
  ArrowUp,
  ArrowDown
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCreateForm, useUpdateForm, type FormField } from "@/lib/hooks"
import { PageHeader } from "@/components/shared"
import { toast } from "sonner"

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const fieldTypes = [
  { type: "text", label: "Text", icon: Type },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Phone", icon: Phone },
  { type: "number", label: "Number", icon: Hash },
  { type: "textarea", label: "Text Area", icon: AlignLeft },
  { type: "select", label: "Dropdown", icon: ChevronDown },
  { type: "radio", label: "Radio", icon: Circle },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "date", label: "Date", icon: Calendar },
]

interface FormBuilderProps {
  initialData?: {
    id: string
    title: string
    slug: string
    description?: string
    fieldsJson: string
    successMessage?: string
    redirectUrl?: string
    settingsJson?: string
  }
}

export function FormBuilder({ initialData }: FormBuilderProps) {
  const router = useRouter()
  const createForm = useCreateForm()
  const updateForm = useUpdateForm()
  const isEditing = !!initialData

  const parsedSettings = initialData?.settingsJson 
    ? JSON.parse(initialData.settingsJson) 
    : {}

  const [fields, setFields] = useState<FormField[]>(
    initialData?.fieldsJson ? JSON.parse(initialData.fieldsJson) : []
  )
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      successMessage: parsedSettings.successMessage || initialData?.successMessage || "Thank you for your submission!",
      redirectUrl: parsedSettings.redirectUrl || initialData?.redirectUrl || "",
    },
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const addField = (type: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1) + " Field",
      placeholder: "",
      required: false,
      options: type === "select" || type === "radio" ? [{ label: "Option 1", value: "option1" }] : undefined,
    }
    setFields([...fields, newField])
    setEditingField(newField)
  }

  const updateField = (updatedField: FormField) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)))
    setEditingField(null)
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return
    const temp = newFields[index]
    newFields[index] = newFields[newIndex]
    newFields[newIndex] = temp
    setFields(newFields)
  }

  const onSubmit = async (data: FormData) => {
    if (fields.length === 0) {
      toast.error("Please add at least one field to your form")
      return
    }

    try {
      const formData = {
        ...data,
        fieldsJson: JSON.stringify(fields),
      }

      if (isEditing && initialData) {
        await updateForm.mutateAsync({ id: initialData.id, data: formData })
        toast.success("Form updated successfully")
      } else {
        await createForm.mutateAsync(formData)
        toast.success("Form created successfully")
      }
      router.push("/dashboard/forms")
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save form"
      toast.error(message)
    }
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? "Edit Form" : "Create Form"}
        description="Build your form by adding fields"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Save"} Form
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-white/5 rounded-lg bg-zinc-900/30 p-6">
            <h3 className="text-lg font-medium text-zinc-200 mb-4">Form Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title")}
                  onChange={(e) => {
                    register("title").onChange(e)
                    if (!isEditing) {
                      setValue("slug", generateSlug(e.target.value))
                    }
                  }}
                  className="bg-zinc-800 border-zinc-700"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  disabled={isEditing}
                  className="bg-zinc-800 border-zinc-700"
                />
                {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  className="bg-zinc-800 border-zinc-700"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="successMessage">Success Message</Label>
                <Input
                  id="successMessage"
                  {...register("successMessage")}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          </div>

          <div className="border border-white/5 rounded-lg bg-zinc-900/30 p-6">
            <h3 className="text-lg font-medium text-zinc-200 mb-4">Form Fields ({fields.length})</h3>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
                <p>No fields yet. Add fields from the palette on the right.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-4 border border-white/5 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveField(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(index, "down")}
                        disabled={index === fields.length - 1}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{field.label}</p>
                      <p className="text-xs text-zinc-500">
                        {field.type}
                        {field.required && <span className="text-red-400 ml-1">• required</span>}
                        {field.options && <span className="ml-1">• {field.options.length} options</span>}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingField(field)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-white/5 rounded-lg bg-zinc-900/30 p-6 h-fit lg:sticky lg:top-8">
          <h3 className="text-lg font-medium text-zinc-200 mb-4">Add Field</h3>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                className="flex items-center gap-2 p-3 border border-white/5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600 transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-300">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Field</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Configure the field settings below
            </DialogDescription>
          </DialogHeader>
          {editingField && (
            <FieldEditor field={editingField} onSave={updateField} onCancel={() => setEditingField(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Form Preview</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This is how your form will look to users
            </DialogDescription>
          </DialogHeader>
          <FormPreview title={watch("title")} description={watch("description")} fields={fields} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FieldEditor({
  field,
  onSave,
  onCancel,
}: {
  field: FormField
  onSave: (field: FormField) => void
  onCancel: () => void
}) {
  const [editedField, setEditedField] = useState<FormField>({ ...field })
  const hasOptions = field.type === "select" || field.type === "radio"

  const addOption = () => {
    const options = editedField.options || []
    const newIndex = options.length + 1
    setEditedField({
      ...editedField,
      options: [...options, { label: "Option " + newIndex, value: "option" + newIndex }],
    })
  }

  const updateOption = (index: number, value: string) => {
    const options = [...(editedField.options || [])]
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    options[index] = { label: value, value: slug || "option" + (index + 1) }
    setEditedField({ ...editedField, options })
  }

  const removeOption = (index: number) => {
    setEditedField({
      ...editedField,
      options: editedField.options?.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={editedField.label}
          onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
          className="bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="space-y-2">
        <Label>Placeholder</Label>
        <Input
          value={editedField.placeholder || ""}
          onChange={(e) => setEditedField({ ...editedField, placeholder: e.target.value })}
          className="bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="space-y-2">
        <Label>Help Text</Label>
        <Input
          value={editedField.helpText || ""}
          onChange={(e) => setEditedField({ ...editedField, helpText: e.target.value })}
          className="bg-zinc-800 border-zinc-700"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="required"
          checked={editedField.required}
          onCheckedChange={(checked) => setEditedField({ ...editedField, required: checked as boolean })}
        />
        <Label htmlFor="required" className="cursor-pointer">Required field</Label>
      </div>

      {hasOptions && (
        <div className="space-y-3">
          <Label>Options</Label>
          <div className="space-y-2">
            {editedField.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder="Option label"
                  className="bg-zinc-800 border-zinc-700 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-400 shrink-0"
                  disabled={(editedField.options?.length || 0) <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            Add Option
          </Button>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={() => onSave(editedField)}>Save Field</Button>
      </div>
    </div>
  )
}

function FormPreview({ title, description, fields }: { title: string; description?: string; fields: FormField[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{title || "Untitled Form"}</h2>
        {description && <p className="text-zinc-400 mt-1">{description}</p>}
      </div>

      {fields.length === 0 ? (
        <p className="text-zinc-500 text-center py-8">No fields to preview</p>
      ) : (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea placeholder={field.placeholder} className="bg-zinc-800 border-zinc-700" disabled />
              ) : field.type === "select" ? (
                <Select disabled>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder={field.placeholder || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "radio" ? (
                <div className="space-y-2">
                  {field.options?.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <input type="radio" name={field.id} disabled className="accent-white" />
                      <span className="text-zinc-300">{option.label}</span>
                    </div>
                  ))}
                </div>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <Checkbox disabled />
                  <span className="text-zinc-300">{field.placeholder || "Check this"}</span>
                </div>
              ) : (
                <Input type={field.type} placeholder={field.placeholder} className="bg-zinc-800 border-zinc-700" disabled />
              )}
              {field.helpText && <p className="text-xs text-zinc-500">{field.helpText}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
