"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Check, Link2, Mail, Share2 } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { buildShareLinks } from "@/lib/share-links"

interface Props {
  slug: string
  url: string
  title: string
  text: string
}

const subscribeNoop = () => () => {}

export function ShopShareButton({ slug, url, title, text }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const canNativeShare = useSyncExternalStore(
    subscribeNoop,
    () => "share" in navigator,
    () => false
  )
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement("input")
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      input.remove()
    }
    setCopied(true)
    trackEvent("shop_share", { slug, target: "copy" })
    setTimeout(() => setCopied(false), 2000)
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url })
      trackEvent("shop_share", { slug, target: "native" })
    } catch {
      // User dismissed the share sheet.
    }
    setOpen(false)
  }

  const item =
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 border-2 border-ink bg-card px-3 text-[13px] font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-px"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`Share ${title}`}
          className="absolute right-0 z-30 mt-2 w-56 border-2 border-ink bg-card shadow-[5px_5px_0_0_#04150f] sm:right-auto sm:left-0"
        >
          {canNativeShare && (
            <button
              type="button"
              role="menuitem"
              onClick={nativeShare}
              className={`${item} border-b border-ink/20`}
            >
              <Share2 className="h-4 w-4" />
              Share via device…
            </button>
          )}
          {buildShareLinks(url, text).map((link) => (
            <a
              key={link.key}
              role="menuitem"
              href={link.href}
              target={link.key === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("shop_share", { slug, target: link.key })
                setOpen(false)
              }}
              className={`${item} border-b border-ink/20`}
            >
              {link.key === "email" ? (
                <Mail className="h-4 w-4" />
              ) : (
                <span className="label-mono flex h-4 w-4 items-center justify-center text-[10px] tracking-normal text-inherit">
                  {link.label.charAt(0)}
                </span>
              )}
              {link.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className={item}
          >
            {copied ? (
              <Check className="h-4 w-4 text-open" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  )
}
