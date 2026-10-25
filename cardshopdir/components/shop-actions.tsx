"use client"

import { Globe, Navigation, Phone } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

interface ShopActionsProps {
  slug: string
  website?: string | null
  telephone?: string | null
  mapsUrl: string
}

const BTN =
  "inline-flex items-center gap-2 border-2 border-ink px-4 py-2.5 text-[13px] font-bold tracking-wide uppercase transition-all active:translate-x-px active:translate-y-px"
const PRIMARY = `${BTN} bg-primary text-primary-foreground shadow-[4px_4px_0_0_#04150f] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#04150f] active:shadow-none`
const GHOST = `${BTN} border-foreground/50 bg-transparent text-foreground hover:bg-foreground hover:text-background`

export function ShopActions({
  slug,
  website,
  telephone,
  mapsUrl,
}: ShopActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener nofollow"
          className={PRIMARY}
          onClick={() => trackEvent("shop_outbound", { type: "website", slug })}
        >
          <Globe className="h-4 w-4" />
          Visit Website
        </a>
      )}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener"
        className={website ? GHOST : PRIMARY}
        onClick={() =>
          trackEvent("shop_outbound", { type: "directions", slug })
        }
      >
        <Navigation className="h-4 w-4" />
        Get Directions
      </a>
      {telephone && (
        <a
          href={`tel:${telephone.replace(/[^0-9+]/g, "")}`}
          className={GHOST}
          onClick={() => trackEvent("shop_outbound", { type: "phone", slug })}
        >
          <Phone className="h-4 w-4" />
          {telephone}
        </a>
      )}
    </div>
  )
}

/** Mobile-only fixed action bar so Call / Directions stay one tap away. */
export function ShopStickyBar({
  slug,
  website,
  telephone,
  mapsUrl,
}: ShopActionsProps) {
  const cell =
    "flex flex-1 items-center justify-center gap-2 border-2 border-ink py-3 text-[13px] font-bold uppercase transition-transform active:scale-95"
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-felt-deep px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        {telephone && (
          <a
            href={`tel:${telephone.replace(/[^0-9+]/g, "")}`}
            className={`${cell} bg-primary text-primary-foreground`}
            onClick={() => trackEvent("shop_outbound", { type: "phone", slug })}
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener"
          className={`${cell} ${telephone ? "border-2 border-ink bg-card text-ink" : "bg-primary text-primary-foreground"}`}
          onClick={() =>
            trackEvent("shop_outbound", { type: "directions", slug })
          }
        >
          <Navigation className="h-4 w-4" />
          Directions
        </a>
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener nofollow"
            className={`${cell} border border-border bg-card`}
            onClick={() =>
              trackEvent("shop_outbound", { type: "website", slug })
            }
          >
            <Globe className="h-4 w-4" />
            Website
          </a>
        )}
      </div>
    </div>
  )
}
