"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs"
import { throttle } from "nuqs"
import Image from "next/image"
import { Search, X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { appendUtm } from "@/lib/utm"
import { ProductActions } from "./_components/product-actions"
import { ProductPagination } from "./_components/product-pagination"
import { tiers, sortOptions, type Tier, type SortOption } from "./search-params"

interface Product {
  id: number
  name: string
  slug: string
  tagline: string | null
  thumbnailUrl: string
  websiteUrl: string
  tier: string
  voteCount: number
  dofollow: boolean
  position: number
  batchId: number
  createdAt: Date
  batchWeek: number | null
  batchYear: number | null
}

interface ProductListProps {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

const TIER_STYLES: Record<string, string> = {
  free: "text-muted-foreground bg-muted",
  boost: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
  highlight: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
}

export function ProductList({
  products,
  total,
  page,
  totalPages,
}: ProductListProps) {
  const [isLoading, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      tier: parseAsStringEnum<Tier>(tiers),
      sort: parseAsStringEnum<SortOption>(sortOptions).withDefault("newest"),
      page: parseAsInteger.withDefault(1),
    },
    {
      shallow: false,
      startTransition,
      limitUrlUpdates: throttle(500),
    },
  )

  // Local search state to keep input responsive while URL syncs debounced
  const [localSearch, setLocalSearch] = useState(filters.q)

  // Sync local → URL (debounced via throttle above)
  useEffect(() => {
    if (localSearch !== filters.q) {
      setFilters({ q: localSearch, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Sync URL → local (browser back/forward)
  useEffect(() => {
    setLocalSearch(filters.q)
  }, [filters.q])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Products</h1>
        <span className="text-[12px] tabular-nums text-muted-foreground/60">
          {total} total
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full rounded-lg bg-muted/50 py-2 pl-9 pr-8 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/40 focus:bg-muted"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("")
                searchRef.current?.focus()
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
          <TierTab
            label="All"
            active={!filters.tier}
            onClick={() => setFilters({ tier: null, page: 1 })}
          />
          {tiers.map((t) => (
            <TierTab
              key={t}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
              active={filters.tier === t}
              onClick={() =>
                setFilters({ tier: filters.tier === t ? null : t, page: 1 })
              }
            />
          ))}
        </div>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters({ sort: e.target.value as SortOption, page: 1 })
          }
          className="rounded-lg bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground outline-none transition-colors focus:bg-muted"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="votes">Most votes</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div
        className={cn(
          "transition-opacity",
          isLoading && "pointer-events-none opacity-50",
        )}
      >
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
            <p className="text-[13px] text-muted-foreground">
              {localSearch || filters.tier
                ? "No products match your filters."
                : "No products yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[600px] text-[13px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <th className="py-2.5 pl-3 pr-2 font-medium">Product</th>
                  <th className="px-2 py-2.5 font-medium">Tier</th>
                  <th className="px-2 py-2.5 font-medium">Batch</th>
                  <th className="px-2 py-2.5 text-right font-medium">Votes</th>
                  <th className="py-2.5 pl-2 pr-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                          <Image
                            src={product.thumbnailUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          {product.tagline && (
                            <p className="truncate text-[12px] text-muted-foreground/60">
                              {product.tagline}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          TIER_STYLES[product.tier] ?? TIER_STYLES.free,
                        )}
                      >
                        {product.tier}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {product.batchWeek && product.batchYear
                        ? `W${product.batchWeek} ${product.batchYear}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {product.voteCount}
                    </td>
                    <td className="py-2.5 pl-2 pr-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={appendUtm(product.websiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Visit website"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <ProductActions product={product} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductPagination page={page} totalPages={totalPages} />
    </div>
  )
}

function TierTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-background text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}
