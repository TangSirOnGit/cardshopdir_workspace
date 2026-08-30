"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Download, ImagePlus, Loader2 } from "lucide-react"
import { updateSubmissionThumbnail } from "@/lib/actions/admin"
import { sileo } from "sileo"

interface ThumbnailUploadProps {
  id: number
  currentUrl: string
}

export function ThumbnailUpload({ id, currentUrl }: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()

      await updateSubmissionThumbnail(id, url)
      sileo.success({ title: "Thumbnail updated" })
    } catch {
      sileo.error({ title: "Image upload failed" })
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload() {
    const res = await fetch(currentUrl)
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = currentUrl.split("/").pop() ?? "thumbnail.webp"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="group/img relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
      <Image
        src={currentUrl}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 transition-colors group-hover/img:bg-black/40">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <>
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-opacity hover:bg-white/30 group-hover/img:opacity-100"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-opacity hover:bg-white/30 group-hover/img:opacity-100"
              title="Upload new image"
            >
              <ImagePlus className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
