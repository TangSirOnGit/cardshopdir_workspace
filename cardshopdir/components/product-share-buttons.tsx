"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"

export function ProductShareButtons({
  title,
  url,
}: {
  title: string
  url: string
}) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const xHref = `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      sileo.success({ title: "Link copied" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      sileo.error({ title: "Failed to copy link" })
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on X"
      >
        <XLogo className="h-2.5 w-2.5" />
        Post
      </a>
      <a
        href={linkedinHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on LinkedIn"
      >
        <LinkedInLogo className="h-3 w-3" />
        LinkedIn
      </a>
      <button
        type="button"
        onClick={copyLink}
        className={buttonClass}
        aria-label="Copy link"
      >
        <span className="relative inline-flex h-3 w-3 items-center justify-center">
          <Link2
            className={cn(
              "absolute h-3 w-3 transition-all",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Check
            className={cn(
              "absolute h-3 w-3 text-emerald-500 transition-all",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
            )}
          />
        </span>
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  )
}
