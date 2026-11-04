"use client"

import { useCallback, useState } from "react"
import { Crosshair, Loader2 } from "lucide-react"
import { ShopCard } from "@/components/shop-card"
import { trackEvent } from "@/lib/analytics"
import { NEARBY_RADII, DEFAULT_NEARBY_RADIUS } from "@/lib/geo"
import type { ShopListItem } from "@/lib/shop-types"

type NearbyShop = ShopListItem & { distanceMiles: number }
type Status = "idle" | "locating" | "loading" | "done" | "error"

export function NearbyShops() {
  const [radius, setRadius] = useState<number>(DEFAULT_NEARBY_RADIUS)
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
  const [shops, setShops] = useState<NearbyShop[]>([])
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  )

  const load = useCallback(
    async (c: { lat: number; lng: number }, r: number) => {
      setStatus("loading")
      try {
        const res = await fetch(
          `/api/shops/nearby?lat=${c.lat}&lng=${c.lng}&radius=${r}`
        )
        if (!res.ok) throw new Error(String(res.status))
        const data = (await res.json()) as { shops: NearbyShop[] }
        setShops(data.shops)
        setStatus("done")
      } catch {
        setMessage(
          "We couldn't load nearby shops. Please try again in a moment."
        )
        setStatus("error")
      }
    },
    []
  )

  const locate = () => {
    if (!navigator.geolocation) {
      setMessage(
        "Your browser doesn't support location. Use the search box above instead."
      )
      setStatus("error")
      return
    }
    trackEvent("near_me_locate_click")
    setStatus("locating")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        load(c, radius)
      },
      (err) => {
        trackEvent("near_me_locate_failed", { code: err.code })
        setMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Use the search box above to search by city, state or zip."
            : "We couldn't determine your location. Use the search box above instead."
        )
        setStatus("error")
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    )
  }

  const changeRadius = (r: number) => {
    setRadius(r)
    if (coords) load(coords, r)
  }

  const busy = status === "locating" || status === "loading"

  return (
    <section aria-live="polite" className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-primary px-4 py-2.5 text-[14px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          {status === "locating" ? "Finding you..." : "Use my location"}
        </button>
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Search radius in miles"
        >
          {NEARBY_RADII.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => changeRadius(r)}
              aria-pressed={radius === r}
              className={`rounded-sm border-2 border-ink px-3 py-2 text-[13px] font-semibold ${
                radius === r ? "bg-ink text-paper" : "bg-card"
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>

      {status === "error" && (
        <p className="text-[14px] text-muted-foreground">{message}</p>
      )}

      {status === "done" && shops.length === 0 && (
        <p className="text-[14px] text-muted-foreground">
          No card shops found within {radius} miles. Try a larger radius or
          search by city above.
        </p>
      )}

      {status === "done" && shops.length > 0 && (
        <>
          <p className="text-[14px] text-muted-foreground">
            {shops.length} card shop{shops.length === 1 ? "" : "s"} within{" "}
            {radius} miles, nearest first.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <div key={s.id} className="space-y-1.5">
                <p className="label-mono">
                  {s.distanceMiles.toFixed(1)} mi away
                </p>
                <ShopCard shop={s} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
