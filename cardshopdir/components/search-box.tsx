"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

/**
 * Client-side search box with Umami event tracking.
 * Falls back to standard form submission if JS is disabled.
 */
export function SearchBox({
  action = "/directory/search",
  placeholder = "Search by shop name, city, state, street, or zip...",
  className = "",
  initialValue = "",
  large = false,
}: {
  action?: string
  placeholder?: string
  className?: string
  initialValue?: string
  large?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialValue)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    trackEvent("search", { query: q })
    router.push(`${action}?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={`glow-ring relative flex items-stretch border-2 border-ink bg-card ${
          large ? "h-14" : "h-11"
        }`}
      >
        <Search
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted ${
            large ? "left-4 h-5 w-5" : "left-3 h-4 w-4"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search card shops"
          className={`h-full min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-muted/80 ${
            large ? "pr-2 pl-12 text-[15px]" : "pr-3 pl-10 text-[14px]"
          }`}
        />
        <kbd
          aria-hidden="true"
          className="label-mono my-auto mr-2 hidden h-6 w-6 shrink-0 items-center justify-center border border-ink/40 tracking-normal text-ink-muted sm:flex"
        >
          /
        </kbd>
        <button
          type="submit"
          className="shrink-0 border-l-2 border-ink bg-vermilion px-5 text-[13px] font-bold tracking-wide text-[#fff6e4] uppercase transition-colors hover:bg-ink active:translate-y-px"
        >
          Search
        </button>
      </div>
    </form>
  )
}
