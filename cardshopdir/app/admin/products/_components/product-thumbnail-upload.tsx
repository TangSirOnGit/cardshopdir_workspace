"use client"

import { useState } from "react"
import Image from "next/image"
import { ImagePlus, Loader2 } from "lucide-react"
import { updateProduct } from "@/lib/actions/admin"
import { sileo } from "sileo"

interface ProductThumbnailUploadProps {
  id: number
  currentUrl: string
  name: string
}

export function ProductThumbnailUpload({ id, currentUrl, name }: ProductThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()

      await updateProduct(id, { thumbnailUrl: url })
    } catch {
      sileo.error({ title: "Image upload failed" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="group/img relative aspect-video w-36 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-muted">
      <Image
        src={currentUrl}
        alt={name}
        fill
        className="object-cover"
        sizes="144px"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/40">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <ImagePlus className="h-4 w-4 text-white opacity-0 transition-opacity group-hover/img:opacity-100" />
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  )
}
