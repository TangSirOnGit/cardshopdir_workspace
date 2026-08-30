"use client"

import { useState } from "react"
import { Check, Link2, Mail } from "lucide-react"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

interface ShareButtonProps {
  href?: string
  onClick?: () => void
  label: string
  children: React.ReactNode
}

function ShareButton({ href, onClick, label, children }: ShareButtonProps) {
  const className =
    "inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background px-3.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {children}
    </button>
  )
}

// Brand marks that Lucide doesn't ship (or ships outdated). Kept inline
// so we don't pull another icon package just for 3 logos.

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

export function SharePost({
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
  const emailHref = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`

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
    <div className="mt-16 flex flex-col items-start gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[13px] font-semibold tracking-tight">
          Enjoyed this post?
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Share it with your network.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ShareButton href={xHref} label="Share on X">
          <XLogo className="h-3 w-3" />
          <span>Post</span>
        </ShareButton>
        <ShareButton href={linkedinHref} label="Share on LinkedIn">
          <LinkedInLogo className="h-3.5 w-3.5" />
          <span>LinkedIn</span>
        </ShareButton>
        <ShareButton href={emailHref} label="Share via email">
          <Mail className="h-3.5 w-3.5" />
          <span>Email</span>
        </ShareButton>
        <ShareButton onClick={copyLink} label="Copy link">
          <span
            className={cn(
              "relative inline-flex h-3.5 w-3.5 items-center justify-center",
            )}
          >
            <Link2
              className={cn(
                "absolute h-3.5 w-3.5 transition-all",
                copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
              )}
            />
            <Check
              className={cn(
                "absolute h-3.5 w-3.5 text-emerald-500 transition-all",
                copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            />
          </span>
          <span>{copied ? "Copied" : "Copy link"}</span>
        </ShareButton>
      </div>
    </div>
  )
}
