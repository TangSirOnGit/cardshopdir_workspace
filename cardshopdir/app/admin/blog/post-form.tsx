"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import Image from "next/image"
import { BlogEditor } from "./blog-editor"
import { createPost, updatePost, deletePost } from "./actions"
import { sileo } from "sileo"
import { Trash2, ImagePlus, X as XIcon, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PostFormProps {
  post?: {
    id: number
    title: string
    excerpt: string | null
    content: string
    imageUrl: string | null
    status: "draft" | "published"
  }
}

type PendingAction = "draft" | "published" | "delete" | null

export function PostForm({ post }: PostFormProps) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [imageUrl, setImageUrl] = useState(post?.imageUrl ?? "")
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [uploading, setUploading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])


  function markDirty<T extends (value: string) => void>(setter: T) {
    return (value: string) => {
      setIsDirty(true)
      setter(value)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      setImageUrl(url)
      setIsDirty(true)
      sileo.success({ title: "Image uploaded" })
    } catch {
      sileo.error({ title: "Upload failed" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleSave(status: "draft" | "published") {
    if (!title.trim()) {
      sileo.error({ title: "Title is required" })
      return
    }
    if (!content.trim()) {
      sileo.error({ title: "Content is required" })
      return
    }

    setPendingAction(status)
    startTransition(async () => {
      try {
        const data = { title, excerpt, content, imageUrl, status }
        if (post) {
          await updatePost(post.id, data)
          setIsDirty(false)
          sileo.success({
            title:
              status === "published" ? "Post published" : "Draft saved",
          })
        } else {
          await createPost(data)
          setIsDirty(false)
        }
      } catch {
        sileo.error({ title: "Something went wrong" })
      } finally {
        setPendingAction(null)
      }
    })
  }

  function confirmDelete() {
    if (!post) return
    setShowDeleteModal(false)
    setPendingAction("delete")
    startTransition(async () => {
      try {
        await deletePost(post.id)
      } catch {
        sileo.error({ title: "Failed to delete" })
        setPendingAction(null)
      }
    })
  }

  const setTitleDirty = markDirty(setTitle)
  const setExcerptDirty = markDirty(setExcerpt)
  const setContentDirty = markDirty(setContent)

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[13px] font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitleDirty(e.target.value)}
          placeholder="Post title"
          className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60"
          maxLength={200}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium">
          Excerpt <span className="text-muted-foreground/50">(optional)</span>
        </label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerptDirty(e.target.value)}
          placeholder="Short summary for listing pages"
          className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60"
          maxLength={300}
        />
        <p className="mt-1 text-[11px] tabular-nums text-muted-foreground/60">
          {excerpt.length}/300
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium">
          Cover image <span className="text-muted-foreground/50">(optional)</span>
        </label>
        {imageUrl ? (
          <div className="group relative aspect-[2.2/1] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
            <Image
              src={imageUrl}
              alt="Cover preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-colors group-hover:bg-black/40">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-white/30 group-hover:opacity-100 disabled:opacity-50"
                aria-label="Replace image"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageUrl("")
                  setIsDirty(true)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-white/30 group-hover:opacity-100"
                aria-label="Remove image"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 py-10 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Upload cover image
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium">Content</label>
        <BlogEditor onChange={setContentDirty} initialContent={post?.content} />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {pendingAction === "draft" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {post?.status === "published" ? "Unpublish" : "Save as draft"}
        </button>
        <button
          type="button"
          onClick={() => handleSave("published")}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pendingAction === "published" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {post?.status === "published" ? "Update" : "Publish"}
        </button>
        {isDirty && (
          <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">
            Unsaved changes
          </span>
        )}
        {post && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          >
            {pendingAction === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
        )}
      </div>

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
