"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

/**
 * Client-side search box with Umami event tracking.
 * Falls back to standard form submission if JS is disabled.
 */
export function SearchBox({
  action = "/directory/search",
  placeholder = "Search by city, state, or shop name...",
  className = "",
  initialValue = "",
}: {
  action?: string
  placeholder?: string
  className?: string
  initialValue?: string
}) {
  const [query, setQuery] = useState(initialValue)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    trackEvent("search", { query: q })
    router.push(`${action}?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-border bg-background pr-4 pl-10 text-[14px] transition-colors outline-none focus:border-foreground/30"
        />
      </div>
    </form>
  )
}
