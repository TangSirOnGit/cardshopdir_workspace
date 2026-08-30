"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback, useState, useRef, useEffect } from "react"

const CHAR_LIMIT = 1000

interface DescriptionEditorProps {
  onChange: (html: string) => void
  initialContent?: string
}

export function DescriptionEditor({
  onChange,
  initialContent,
}: DescriptionEditorProps) {
  const [linkPopover, setLinkPopover] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const linkInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Description (optional)",
      }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "outline-none min-h-[80px] max-h-[200px] overflow-y-auto px-4 py-3 text-[14px]",
        "aria-label": "Product description",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  useEffect(() => {
    if (linkPopover && linkInputRef.current) {
      linkInputRef.current.focus()
    }
  }, [linkPopover])

  const openLinkPopover = useCallback(() => {
    if (!editor) return
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const existingUrl = editor.getAttributes("link").href ?? ""
    setLinkUrl(existingUrl)
    setLinkPopover(true)
  }, [editor])

  const applyLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) {
      setLinkPopover(false)
      setLinkUrl("")
      return
    }
    let href = linkUrl.trim()
    if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`
    }
    editor.chain().focus().setLink({ href }).run()
    setLinkPopover(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  const cancelLink = useCallback(() => {
    setLinkPopover(false)
    setLinkUrl("")
    editor?.chain().focus().run()
  }, [editor])

  if (!editor) return null

  const chars = editor.storage.characterCount.characters()

  return (
    <div className="rounded-xl bg-muted/50 transition-colors focus-within:bg-muted">
      <div className="relative flex items-center gap-0.5 border-b border-border/40 px-3 py-1.5">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={openLinkPopover}
          aria-label="Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/50">
          {chars} / {CHAR_LIMIT}
        </span>

        {linkPopover && (
          <div className="absolute top-full left-0 z-10 mt-1 flex w-full items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 shadow-sm">
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  applyLink()
                }
                if (e.key === "Escape") cancelLink()
              }}
              placeholder="https://example.com"
              className="min-w-0 flex-1 rounded-md bg-muted/50 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={applyLink}
              className="rounded-md p-1.5 text-foreground transition-colors hover:bg-muted"
              aria-label="Apply link"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelLink}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  active,
  children,
  ...props
}: {
  active: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
        active && "bg-foreground/10 text-foreground",
      )}
      {...props}
    >
      {children}
    </button>
  )
}
