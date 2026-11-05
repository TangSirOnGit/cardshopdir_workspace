"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Crosshair, Loader2 } from "lucide-react"
import { ShopCard } from "@/components/shop-card"
import { trackEvent } from "@/lib/analytics"
import { NEARBY_RADII } from "@/lib/geo"
import {
  fetchNearby,
  type NearbyData,
  type NearbyShop,
  type NearbySource,
} from "@/lib/nearby-client"

type Status = "loading" | "done" | "unavailable" | "error"
type Source = NearbySource

const INITIAL_RADIUS = 20
const GPS_TIMEOUT_MS = 12000

export function NearbyShops() {
  const [radius, setRadius] = useState<number>(INITIAL_RADIUS)
  const [status, setStatus] = useState<Status>("loading")
  const [notice, setNotice] = useState("")
  const [shops, setShops] = useState<NearbyShop[]>([])
  const [place, setPlace] = useState<string | null>(null)
  const [source, setSource] = useState<Source>({ kind: "ip" })
  const [locating, setLocating] = useState(false)
  const gpsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gpsSettled = useRef(true)

  const apply = useCallback((src: Source, data: NearbyData | null) => {
    if (!data) return setStatus("error")
    if (src.kind === "ip" && data.located === false)
      return setStatus("unavailable")
    setPlace(src.kind === "ip" ? (data.place ?? null) : null)
    setShops(data.shops)
    setStatus("done")
  }, [])

  const load = useCallback(
    (src: Source, r: number) => fetchNearby(src, r).then((d) => apply(src, d)),
    [apply]
  )

  useEffect(() => {
    let cancelled = false
    const src: Source = { kind: "ip" }
    fetchNearby(src, INITIAL_RADIUS).then((d) => {
      if (cancelled) return
      trackEvent("near_me_ip_result", { located: d?.located !== false && !!d })
      apply(src, d)
    })
    return () => {
      cancelled = true
    }
  }, [apply])

  const finishGps = () => {
    gpsSettled.current = true
    setLocating(false)
    if (gpsTimer.current) clearTimeout(gpsTimer.current)
  }

  const locate = async () => {
    trackEvent("near_me_locate_click")
    if (!navigator.geolocation) {
      setNotice("Your browser doesn't support precise location.")
      return
    }
    try {
      const perm = await navigator.permissions?.query({ name: "geolocation" })
      if (perm?.state === "denied") {
        setNotice(
          "Location is blocked for this site. Allow it in your browser's site settings, or search by city above."
        )
        return
      }
    } catch {}
    setNotice("")
    setLocating(true)
    gpsSettled.current = false
    gpsTimer.current = setTimeout(() => {
      if (gpsSettled.current) return
      finishGps()
      trackEvent("near_me_locate_failed", { code: -1 })
      setNotice(
        "We didn't get a response from your browser, so we're showing results near your approximate location."
      )
    }, GPS_TIMEOUT_MS)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (gpsSettled.current) return
        finishGps()
        const src: Source = {
          kind: "gps",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setSource(src)
        setStatus("loading")
        load(src, radius)
      },
      (err) => {
        if (gpsSettled.current) return
        finishGps()
        trackEvent("near_me_locate_failed", { code: err.code })
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied, so we're showing results near your approximate location."
            : "We couldn't get your precise location, so we're showing results near your approximate location."
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    )
  }

  const changeRadius = (r: number) => {
    setRadius(r)
    setStatus("loading")
    load(source, r)
  }

  if (status === "unavailable") {
    return (
      <section className="space-y-3">
        <Button locating={locating} onClick={locate} precise={false} />
        {notice && (
          <p className="text-[14px] text-muted-foreground">{notice}</p>
        )}
      </section>
    )
  }

  const busy = status === "loading"

  return (
    <section aria-live="polite" className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {source.kind === "ip" && (
          <Button locating={locating} onClick={locate} precise />
        )}
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
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {notice && <p className="text-[14px] text-muted-foreground">{notice}</p>}

      {status === "error" && (
        <p className="text-[14px] text-muted-foreground">
          We couldn&apos;t load nearby shops. Search by city above instead.
        </p>
      )}

      {status === "done" && (
        <p className="text-[14px] text-muted-foreground">
          {shops.length === 0
            ? `No card shops found within ${radius} miles. Try a larger radius or search by city above.`
            : source.kind === "gps"
              ? `${shops.length} card shop${shops.length === 1 ? "" : "s"} within ${radius} miles of your location, nearest first.`
              : `${shops.length} card shop${shops.length === 1 ? "" : "s"} within ${radius} miles of ${place ? place : "your approximate location"}, nearest first. Based on your network location, which can be off by a few miles.`}
        </p>
      )}

      {shops.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${
            busy ? "opacity-60" : ""
          }`}
        >
          {shops.map((s) => (
            <div key={s.id} className="space-y-1.5">
              <p className="label-mono">{s.distanceMiles.toFixed(1)} mi away</p>
              <ShopCard shop={s} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Button({
  locating,
  onClick,
  precise,
}: {
  locating: boolean
  onClick: () => void
  precise: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      className="inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-primary px-4 py-2.5 text-[14px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      {locating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Crosshair className="h-4 w-4" />
      )}
      {locating
        ? "Finding you..."
        : precise
          ? "Use precise location"
          : "Use my location"}
    </button>
  )
}
