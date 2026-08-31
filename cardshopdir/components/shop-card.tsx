"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Star, Phone, ArrowRight } from "lucide-react"
import {
  isTopRated,
  type ShopListItem,
  type ShopGameTag,
} from "@/lib/shop-types"
import { trackEvent } from "@/lib/analytics"
import { formatHoursRange } from "@/lib/shop-hours"

// Emoji + short label per game slug, for specialty chips.
const GAME_CHIPS: Record<string, { emoji: string; label: string }> = {
  pokemon: { emoji: "⚡", label: "Pokémon" },
  "magic-the-gathering": { emoji: "🪄", label: "MTG" },
  "yu-gi-oh": { emoji: "🎴", label: "Yu-Gi-Oh!" },
  "flesh-and-blood": { emoji: "⚔️", label: "Flesh & Blood" },
  sports: { emoji: "⚾", label: "Sports" },
  lorcana: { emoji: "✨", label: "Lorcana" },
  "dragon-ball-super": { emoji: "🐉", label: "DBS" },
  "star-wars-unlimited": { emoji: "🚀", label: "Star Wars" },
  "one-piece": { emoji: "🏴‍☠️", label: "One Piece" },
  "union-arena": { emoji: "🥊", label: "Union Arena" },
  digimon: { emoji: "🤖", label: "Digimon" },
  "final-fantasy": { emoji: "🗡️", label: "Final Fantasy" },
  "weiss-schwarz": { emoji: "🌸", label: "Weiss Schwarz" },
  "cardfight-vanguard": { emoji: "🛡️", label: "Vanguard" },
  riftbound: { emoji: "🌀", label: "Riftbound" },
}

function gameChip(g: ShopGameTag): { emoji: string; label: string } {
  return GAME_CHIPS[g.slug] || { emoji: "🃏", label: g.displayName }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n).trimEnd() + "…"
}

export function ShopCard({ shop }: { shop: ShopListItem }) {
  const chips = (shop.games ?? []).slice(0, 4).map(gameChip)
  const top = isTopRated(shop)
  const hoursLabel = shop.todayHours ? formatHoursRange(shop.todayHours) : null
  const open = shop.isOpenNow

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group flex flex-col rounded-lg border border-border/50 bg-card p-4 transition-colors hover:border-border hover:bg-muted/30"
      onClick={() =>
        trackEvent("shop_click", {
          slug: shop.slug,
          name: shop.name,
          state: shop.state || "",
        })
      }
    >
      {/* Top row: image + name/rating/address */}
      <div className="flex gap-3">
        {shop.imageUrl ? (
          <Image
            src={shop.imageUrl}
            alt={shop.name}
            width={84}
            height={84}
            className="h-21 w-21 shrink-0 rounded-md object-cover ring-1 ring-border/40"
          />
        ) : (
          <div className="flex h-21 w-21 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] text-muted-foreground">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[14px] leading-tight font-semibold transition-colors group-hover:text-muted-foreground">
              {shop.name}
            </p>
            {top && (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Top Rated
              </span>
            )}
          </div>

          {/* Rating */}
          {shop.ratingValue && (
            <p className="mt-1 flex items-center gap-1 text-[12px]">
              <Star className="h-3 w-3 fill-current text-amber-500" />
              <span className="font-semibold text-foreground">
                {shop.ratingValue}
              </span>
              <span className="text-muted-foreground">
                ({shop.reviewCount ?? 0} reviews)
              </span>
            </p>
          )}

          {/* Address */}
          <p className="mt-1 flex items-start gap-1 text-[12px] text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="truncate">
              {shop.street ? `${shop.street}, ` : ""}
              {shop.city}, {shop.state}
            </span>
          </p>
        </div>
      </div>

      {/* Specialty chips */}
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span
              key={i}
              className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {c.emoji} {c.label}
            </span>
          ))}
        </div>
      )}

      {/* Description snippet */}
      {shop.description && (
        <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/80">
          {truncate(shop.description, 120)}
        </p>
      )}

      {/* Footer: hours + status + CTA */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
        <div className="flex min-w-0 items-center gap-2 text-[11px]">
          {hoursLabel && (
            <span className="text-muted-foreground">{hoursLabel}</span>
          )}
          {hoursLabel && (
            <span
              className={`flex items-center gap-1 font-medium ${
                open
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  open ? "bg-emerald-500" : "bg-muted-foreground/40"
                }`}
              />
              {open ? "Open" : "Closed"}
            </span>
          )}
          {shop.telephone && !hoursLabel && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {shop.telephone}
            </span>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-foreground opacity-70 transition-opacity group-hover:opacity-100">
          View
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

export function ShopGrid({ shops }: { shops: ShopListItem[] }) {
  if (shops.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No shops found in this area.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  )
}
