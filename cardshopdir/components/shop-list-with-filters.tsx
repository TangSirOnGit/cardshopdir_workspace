"use client"

import { useMemo, useState } from "react"
import { ShopGrid } from "@/components/shop-card"
import type { ShopListItem, ShopGameTag } from "@/lib/shop-types"

type SortKey = "rating" | "reviews" | "alpha"

interface SpecialtyFilter {
  slug: string
  label: string
  count: number
}

interface ShopListWithFiltersProps {
  shops: ShopListItem[]
  specialties: SpecialtyFilter[]
  /** Label shown in the result counter, e.g. "Georgia" */
  scopeLabel?: string
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "rating", label: "Highest Rated" },
  { key: "reviews", label: "Most Reviewed" },
  { key: "alpha", label: "A → Z" },
]

export function ShopListWithFilters({
  shops,
  specialties,
  scopeLabel,
}: ShopListWithFiltersProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>("rating")

  const filtered = useMemo(() => {
    let list = shops
    if (activeSlug) {
      list = list.filter((s) =>
        (s.games ?? []).some((g: ShopGameTag) => g.slug === activeSlug)
      )
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name)
      if (sort === "reviews") return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      // rating (default)
      const ra = a.ratingValue ? parseFloat(a.ratingValue) : 0
      const rb = b.ratingValue ? parseFloat(b.ratingValue) : 0
      if (rb !== ra) return rb - ra
      return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    })
    return sorted
  }, [shops, activeSlug, sort])

  return (
    <div className="space-y-4">
      {/* Filter + sort controls */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Specialty chips */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSlug(null)}
              className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                activeSlug === null
                  ? "border-foreground/30 bg-foreground text-background"
                  : "border-border/50 bg-background text-muted-foreground hover:bg-muted/60"
              }`}
            >
              All
            </button>
            {specialties.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() =>
                  setActiveSlug((cur) => (cur === s.slug ? null : s.slug))
                }
                className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  activeSlug === s.slug
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border/50 bg-background text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {s.label} {s.count}
              </button>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-muted-foreground">Sort</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setSort(o.key)}
                className={`rounded-md px-2 py-1 transition-colors ${
                  sort === o.key
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="text-[12px] text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span>{" "}
        shop{filtered.length === 1 ? "" : "s"}
        {scopeLabel ? ` in ${scopeLabel}` : ""}
        {activeSlug ? " for this specialty" : ""}
      </p>

      <ShopGrid shops={filtered} />
    </div>
  )
}
