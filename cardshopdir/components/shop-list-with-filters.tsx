"use client"

import { useMemo, useState } from "react"
import { ShopGrid } from "@/components/shop-card"
import { GAME_THEMES } from "@/lib/game-theme"
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
  { key: "rating", label: "Top Rated" },
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
  const [openOnly, setOpenOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = shops
    if (activeSlug) {
      list = list.filter((s) =>
        (s.games ?? []).some((g: ShopGameTag) => g.slug === activeSlug)
      )
    }
    if (openOnly) list = list.filter((s) => s.isOpenNow)
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name)
      if (sort === "reviews") return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      const ra = a.ratingValue ? parseFloat(a.ratingValue) : 0
      const rb = b.ratingValue ? parseFloat(b.ratingValue) : 0
      if (rb !== ra) return rb - ra
      return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    })
    return sorted
  }, [shops, activeSlug, sort, openOnly])

  const chip =
    "shrink-0 rounded-sm border-2 px-3 py-1.5 text-[12px] font-bold whitespace-nowrap transition-colors active:translate-y-px"

  return (
    <div className="space-y-5">
      {/* Sticky filter bar */}
      <div className="sticky top-[65px] z-30 -mx-6 border-y-2 border-foreground/80 bg-background px-6 py-3 sm:mx-0 sm:border-2 sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {specialties.length > 0 && (
            <div className="-mx-6 flex [scrollbar-width:none] items-center gap-1.5 overflow-x-auto px-6 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setActiveSlug(null)}
                className={`${chip} ${
                  activeSlug === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {specialties.map((s) => {
                const t = GAME_THEMES[s.slug]
                const active = activeSlug === s.slug
                const hue = t?.hue ?? 260
                return (
                  <button
                    key={s.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setActiveSlug((cur) => (cur === s.slug ? null : s.slug))
                    }
                    className={`${chip} ${
                      active
                        ? ""
                        : "border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                    style={
                      active
                        ? {
                            color: "#14110c",
                            backgroundColor: `oklch(0.84 0.115 ${hue})`,
                            borderColor: "#14110c",
                          }
                        : undefined
                    }
                  >
                    {s.label}{" "}
                    <span className="label-mono tracking-normal opacity-70">
                      {s.count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-3 text-[12px]">
            <button
              type="button"
              role="switch"
              aria-checked={openOnly}
              onClick={() => setOpenOnly((v) => !v)}
              className="flex items-center gap-2 border-2 border-border px-3 py-1.5 font-bold transition-colors hover:border-foreground"
            >
              <span
                className={`relative h-4 w-7 rounded-full transition-colors ${
                  openOnly ? "bg-open" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-foreground transition-transform ${
                    openOnly ? "translate-x-3" : ""
                  }`}
                />
              </span>
              Open now
            </button>
            <select
              aria-label="Sort shops"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-sm border-2 border-border bg-background px-3 py-1.5 font-bold outline-none hover:border-foreground focus-visible:border-primary"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="label-mono tracking-[0.08em] normal-case">
        Showing{" "}
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        shop{filtered.length === 1 ? "" : "s"}
        {scopeLabel ? ` in ${scopeLabel}` : ""}
        {activeSlug ? " for this specialty" : ""}
        {openOnly ? " · open now" : ""}
      </p>

      <ShopGrid shops={filtered} />
    </div>
  )
}
