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
import { gameTheme, type GameTheme } from "@/lib/game-theme"
import { FavoriteShopButton } from "@/components/favorite-shop-button"

type Chip = GameTheme

function gameChip(g: ShopGameTag): Chip {
  return gameTheme(g.slug, g.displayName)
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
  const hue = chips[0]?.hue ?? 85

  return (
    <div className="relative">
      <Link
        href={`/shop/${shop.slug}`}
        className="vault-card group flex h-full flex-col overflow-hidden rounded-sm border-2 border-ink bg-card"
        onClick={() =>
          trackEvent("shop_click", {
            slug: shop.slug,
            name: shop.name,
            state: shop.state || "",
          })
        }
      >
        <div className="relative aspect-16/10 w-full overflow-hidden border-b-2 border-ink bg-muted">
          {shop.imageUrl ? (
            <Image
              src={shop.imageUrl}
              alt={shop.name}
              fill
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-end justify-between p-3"
              style={{ backgroundColor: `oklch(0.8 0.13 ${hue})` }}
            >
              <span className="font-serif text-[5.5rem] leading-[0.8] font-bold text-ink/80">
                {shop.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="label-mono text-ink!">
                {chips[0]?.label ?? "Card shop"}
              </span>
            </div>
          )}
          {top && (
            <span className="label-mono absolute top-0 right-0 bg-ink px-2.5 py-1.5 text-[10px] tracking-wider text-marigold!">
              ★ Top Rated
            </span>
          )}
          {hoursLabel && (
            <span
              className={`label-mono absolute bottom-0 left-0 flex items-center gap-1.5 border-t-2 border-r-2 border-ink px-2.5 py-1.5 text-[10px] ${
                open ? "bg-open text-ink!" : "bg-paper text-ink-muted!"
              }`}
            >
              {open ? "Open now" : "Closed"}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="font-serif text-[18px] leading-tight font-bold tracking-tight group-hover:text-primary">
            {shop.name}
          </p>

          {shop.ratingValue && (
            <p className="mt-2 flex items-center gap-1 text-[12px]">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span className="font-semibold text-foreground">
                {shop.ratingValue}
              </span>
              <span className="text-muted-foreground">
                ({shop.reviewCount ?? 0} reviews)
              </span>
            </p>
          )}

          <p className="mt-1 flex items-start gap-1 text-[12px] text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="truncate">
              {shop.street ? `${shop.street}, ` : ""}
              {shop.city}, {shop.state}
            </span>
          </p>

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="rounded-sm border border-ink/70 px-1.5 py-0.5 text-[11px] font-semibold text-ink"
                  style={{ backgroundColor: `oklch(0.86 0.1 ${c.hue})` }}
                >
                  {c.label}
                </span>
              ))}
            </div>
          )}

          {shop.description && (
            <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {truncate(shop.description, 120)}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink/25 pt-3">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
              {hoursLabel && <span className="tabular-nums">{hoursLabel}</span>}
              {shop.telephone && !hoursLabel && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {shop.telephone}
                </span>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-primary">
              View
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
      <FavoriteShopButton shop={shop} className="absolute top-2 left-2 z-10" />
    </div>
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <ShopCard key={shop.id} shop={shop} />
      ))}
    </div>
  )
}
