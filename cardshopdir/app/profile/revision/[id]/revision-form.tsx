"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react"
import { sileo } from "sileo"
import { DescriptionEditor } from "@/components/description-editor"

interface RevisionFormProps {
  submissionId: number
  name: string
  tagline: string | null
  websiteUrl: string
  description: string | null
  thumbnailUrl: string
  reasons: string[]
}

async function uploadThumbnail(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  if (!res.ok) throw new Error("Upload failed")
  const { url } = await res.json()
  return url as string
}

async function resubmit(
  id: number,
  data: {
    name: string
    tagline: string
    websiteUrl: string
    description: string
    thumbnailUrl?: string
  },
) {
  const res = await fetch(`/api/submissions/${id}/resubmit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Failed" }))
    throw new Error(error || "Failed to resubmit")
  }
}

export function RevisionForm({
  submissionId,
  name,
  tagline,
  websiteUrl,
  description,
  thumbnailUrl,
  reasons,
}: RevisionFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name,
    tagline: tagline ?? "",
    websiteUrl,
    description: description ?? "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith("image/")) {
      sileo.error({ title: "Please pick an image file" })
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        let uploadedUrl: string | undefined
        if (file) {
          uploadedUrl = await uploadThumbnail(file)
        }
        await resubmit(submissionId, {
          name: form.name,
          tagline: form.tagline,
          websiteUrl: form.websiteUrl,
          description: form.description,
          thumbnailUrl: uploadedUrl,
        })
        sileo.success({ title: "Resubmitted for review" })
        router.push("/profile")
        router.refresh()
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Something went wrong",
        })
      }
    })
  }

  const shownThumbnail = preview ?? thumbnailUrl

  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col pt-2 sm:pt-4">
      <button
        type="button"
        onClick={() => router.push("/profile")}
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mb-6 space-y-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-orange-500 uppercase">
          Revision requested
        </p>
        <p className="text-[13px] text-muted-foreground">
          Please update your submission based on the feedback below, then
          resubmit for review.
        </p>
        <ul className="mt-3 space-y-1.5 rounded-xl bg-orange-500/10 px-4 py-3">
          {reasons.map((r, i) => (
            <li
              key={i}
              className="text-[13px] text-orange-600 dark:text-orange-400"
            >
              • {r}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shownThumbnail}
              alt="Thumbnail preview"
              className="h-full w-full object-cover"
            />
            {preview ? (
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2.5 right-2.5 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
                aria-label="Keep current thumbnail"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <label
                htmlFor="revision-thumbnail"
                className="absolute top-2.5 right-2.5 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-black/60"
              >
                <ImagePlus className="h-3 w-3" />
                Replace
                <input
                  id="revision-thumbnail"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground/80">
            1280 &times; 720px (16:9)
          </p>
        </div>

        <input
          type="text"
          required
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
        />

        <input
          type="text"
          required
          placeholder="Tagline"
          aria-label="Tagline"
          value={form.tagline}
          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
        />

        <DescriptionEditor
          initialContent={form.description}
          onChange={(html) => setForm((f) => ({ ...f, description: html }))}
        />

        <input
          type="url"
          required
          placeholder="https://yourproduct.com"
          value={form.websiteUrl}
          onChange={(e) =>
            setForm((f) => ({ ...f, websiteUrl: e.target.value }))
          }
          className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
        />

        <button
          type="submit"
          disabled={isPending || !form.name || !form.tagline || !form.websiteUrl}
          className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          {isPending ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            "Resubmit for review"
          )}
        </button>
      </form>
    </div>
  )
}
