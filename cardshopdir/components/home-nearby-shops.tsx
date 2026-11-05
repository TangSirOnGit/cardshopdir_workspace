"use client"

import { useEffect, useRef, useState } from "react"
import { ShopCard } from "@/components/shop-card"
import { SectionTitle } from "@/components/section-title"
import { trackEvent } from "@/lib/analytics"
import {
  fetchNearby,
  type NearbyData,
  type NearbyShop,
} from "@/lib/nearby-client"

const RADIUS = 20
const LIMIT = 6
const MIN_SHOPS = 3

/**
 * Homepage "near you" strip. Uses the approximate (IP) location only, never
 * prompts for permission, and renders nothing when the location is unknown or
 * too few shops are nearby, so the static homepage content is never replaced.
 */
export function HomeNearbyShops() {
  const sentinel = useRef<HTMLDivElement>(null)
  const [shops, setShops] = useState<NearbyShop[]>([])
  const [place, setPlace] = useState<string | null>(null)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    let cancelled = false
    const run = async () => {
      const data: NearbyData | null = await fetchNearby(
        { kind: "ip" },
        RADIUS,
        LIMIT
      )
      if (cancelled) return
      const ok =
        !!data && data.located !== false && data.shops.length >= MIN_SHOPS
      trackEvent("home_nearby_result", {
        located: !!data && data.located !== false,
        shown: ok,
      })
      if (ok && data) {
        setShops(data.shops)
        setPlace(data.place ?? null)
      }
    }
    if (!("IntersectionObserver" in window)) {
      run()
      return () => {
        cancelled = true
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        run()
      },
      { rootMargin: "800px 0px" }
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      {shops.length > 0 && (
        <section
          className="pt-20 sm:pt-28"
          onClickCapture={(e) => {
            const a = (e.target as HTMLElement).closest("a")
            if (a)
              trackEvent("home_nearby_click", {
                href: a.getAttribute("href") ?? "",
              })
          }}
        >
          <SectionTitle
            noRule
            index="00 / Nearby"
            title={place ? `Card Shops Near ${place}` : "Card Shops Near You"}
            href="/near-me"
            cta="See all near you"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <div key={s.id} className="space-y-1.5">
                <p className="label-mono">
                  {s.distanceMiles.toFixed(1)} mi away
                </p>
                <ShopCard shop={s} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Based on your approximate network location.
          </p>
        </section>
      )}
    </>
  )
}
