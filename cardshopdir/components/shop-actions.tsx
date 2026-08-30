"use client"

import { Globe, Navigation, Phone } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

interface ShopActionsProps {
  slug: string
  website?: string | null
  telephone?: string | null
  mapsUrl: string
}

export function ShopActions({
  slug,
  website,
  telephone,
  mapsUrl,
}: ShopActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
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
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-muted/50"
        onClick={() => trackEvent("shop_outbound", { type: "directions", slug })}
      >
        <Navigation className="h-4 w-4" />
        Get Directions
      </a>
      {telephone && (
        <a
          href={`tel:${telephone.replace(/[^0-9+]/g, "")}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-muted/50"
          onClick={() => trackEvent("shop_outbound", { type: "phone", slug })}
        >
          <Phone className="h-4 w-4" />
          {telephone}
        </a>
      )}
    </div>
  )
}
