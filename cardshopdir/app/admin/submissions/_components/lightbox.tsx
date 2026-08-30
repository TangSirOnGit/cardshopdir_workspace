"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, X } from "lucide-react"

interface LightboxProps {
  url: string
  children: React.ReactNode
}

export function Lightbox({ url, children }: LightboxProps) {
  const [open, setOpen] = useState(false)

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = url.split("/").pop() ?? "thumbnail.webp"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative aspect-video w-full cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              onClick={handleDownload}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Download original"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="w-full max-w-4xl px-6">
            <div
              className="relative aspect-video w-full overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 900px"
                quality={90}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
