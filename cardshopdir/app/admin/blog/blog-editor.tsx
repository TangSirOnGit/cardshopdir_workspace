"use client"

import { useEditor, useEditorState, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import LinkExtension from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Image as ImageExtension } from "@tiptap/extension-image"
import { TableKit } from "@tiptap/extension-table"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading2,
  Heading3,
  Quote,
  Code,
  ImagePlus,
  Loader2,
  Table as TableIcon,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  Columns3,
  Rows3,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sileo } from "sileo"
import { useCallback, useState, useRef } from "react"

interface BlogEditorProps {
  onChange: (html: string) => void
  initialContent?: string
}

export function BlogEditor({ onChange, initialContent }: BlogEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your post...",
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: "rounded-lg" },
      }),
      TableKit.configure({
        table: { resizable: true },
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "tiptap outline-none min-h-[300px] px-4 py-3",
        "aria-label": "Blog post content",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  const toggleLink = useCallback(() => {
    if (!editor) return
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    const href = window.prompt("URL")
    if (!href) return
    const url = /^https?:\/\//i.test(href) ? href : `https://${href}`
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return
      setUploadingImage(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) throw new Error("Upload failed")
        const { url } = await res.json()
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
        sileo.success({ title: "Image inserted" })
      } catch {
        sileo.error({ title: "Image upload failed" })
      } finally {
        setUploadingImage(false)
        if (imageInputRef.current) imageInputRef.current.value = ""
      }
    },
    [editor]
  )

  const insertTable = useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  // Reactive selection-derived state. Re-runs on every editor update so the
  // toolbar active states + conditional table row update as you move the caret.
  const activeState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) {
        return {
          isH2: false,
          isH3: false,
          isBold: false,
          isItalic: false,
          isBulletList: false,
          isOrderedList: false,
          isBlockquote: false,
          isCodeBlock: false,
          isLink: false,
          isTable: false,
          isImage: false,
          linkHref: "" as string,
          imageAlt: "" as string,
          selectionEmpty: true,
        }
      }
      return {
        isH2: e.isActive("heading", { level: 2 }),
        isH3: e.isActive("heading", { level: 3 }),
        isBold: e.isActive("bold"),
        isItalic: e.isActive("italic"),
        isBulletList: e.isActive("bulletList"),
        isOrderedList: e.isActive("orderedList"),
        isBlockquote: e.isActive("blockquote"),
        isCodeBlock: e.isActive("codeBlock"),
        isLink: e.isActive("link"),
        isTable: e.isActive("table"),
        isImage: e.isActive("image"),
        linkHref: (e.getAttributes("link")?.href ?? "") as string,
        imageAlt: (e.getAttributes("image")?.alt ?? "") as string,
        selectionEmpty: e.state.selection.empty,
      }
    },
  })

  if (!editor || !activeState) return null

  return (
    <div className="rounded-xl border border-border/60 bg-background transition-colors focus-within:border-border">
      <div className="sticky top-15 z-20 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-border/60 bg-background px-3 py-1.5">
        <ToolbarButton
          active={activeState.isH2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={activeState.isH3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={activeState.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={activeState.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={activeState.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={activeState.isOrderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={activeState.isBlockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={activeState.isCodeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code block"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={activeState.isLink}
          onClick={toggleLink}
          aria-label="Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          disabled={uploadingImage}
          onClick={() => imageInputRef.current?.click()}
          aria-label="Insert image"
        >
          {uploadingImage ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
        </ToolbarButton>
        <ToolbarButton
          active={activeState.isTable}
          onClick={insertTable}
          aria-label="Insert table"
        >
          <TableIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <BubbleMenu
        editor={editor}
        pluginKey="imageBubbleMenu"
        shouldShow={({ editor: e }) => e.isActive("image")}
        options={{ placement: "top", offset: 8 }}
        className="z-30 flex items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-lg"
      >
        <input
          type="text"
          placeholder="Alt text"
          value={activeState.imageAlt}
          onChange={(e) => {
            editor
              .chain()
              .focus()
              .updateAttributes("image", { alt: e.target.value })
              .run()
          }}
          className="min-w-[180px] rounded-md bg-muted/50 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground/50 focus:bg-muted"
        />
        <div className="mx-0.5 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().deleteSelection().run()}
          aria-label="Delete image"
          title="Delete image"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        pluginKey="tableBubbleMenu"
        shouldShow={({ editor: e }) => e.isActive("table")}
        options={{ placement: "top", offset: 10 }}
        className="z-30 flex items-center gap-0.5 rounded-lg border border-border bg-background p-1 shadow-lg"
      >
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          aria-label="Add column before"
          title="Add column before"
        >
          <ArrowLeftToLine className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          aria-label="Add column after"
          title="Add column after"
        >
          <ArrowRightToLine className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().deleteColumn().run()}
          aria-label="Delete column"
          title="Delete column"
        >
          <Columns3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().addRowBefore().run()}
          aria-label="Add row before"
          title="Add row before"
        >
          <ArrowUpToLine className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().addRowAfter().run()}
          aria-label="Add row after"
          title="Add row after"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().deleteRow().run()}
          aria-label="Delete row"
          title="Delete row"
        >
          <Rows3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-3.5 w-px bg-border/40" />
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().deleteTable().run()}
          aria-label="Delete table"
          title="Delete table"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </BubbleMenu>

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
        "rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50",
        active && "bg-foreground/10 text-foreground"
      )}
      {...props}
    >
      {children}
    </button>
  )
}
