"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useCallback, useEffect } from "react"

interface NewsletterEditorProps {
  content?: string
  onChange?: (json: string, html: string) => void
  placeholder?: string
}

export function NewsletterEditor({ content, onChange, placeholder }: NewsletterEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Start writing your newsletter...",
      }),
    ],
    content: content ? JSON.parse(content) : undefined,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = JSON.stringify(editor.getJSON())
        const html = editor.getHTML()
        onChange(json, html)
      }
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
      try {
        const parsed = JSON.parse(content)
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(parsed)) {
          editor.commands.setContent(parsed)
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return
    
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    setLinkUrl("")
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return
    
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl("")
  }, [editor, imageUrl])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-white/10 rounded-lg bg-zinc-900/50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-zinc-900/80">
        {/* Undo/Redo */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Alignment */}
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Horizontal Rule */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Toggle>

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Toggle size="sm" pressed={editor.isActive("link")}>
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={setLink}>
                  {editor.isActive("link") ? "Update" : "Add"} Link
                </Button>
                {editor.isActive("link") && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => editor.chain().focus().unsetLink().run()}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Popover>
          <PopoverTrigger asChild>
            <Toggle size="sm" pressed={false}>
              <ImageIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button size="sm" onClick={addImage}>
                Add Image
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Styles for the editor */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 400px;
          padding: 1rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #71717a;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
          color: #d4d4d8;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          color: #d4d4d8;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #3f3f46;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #a1a1aa;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #3f3f46;
          margin: 1.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

