import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { and, lte, gte } from "drizzle-orm"
import { format } from "date-fns"
import { appendUtm } from "@/lib/utm"
import { getSettingNumber } from "@/lib/settings"
import { isSafeImageUrl } from "@/lib/images"

export interface Sponsor {
  name: string
  tagline: string
  url: string
  imageUrl?: string | null
}

interface SponsorSlotProps {
  slot: number
  sponsor?: Sponsor | null
}

function SponsorSlotView({ slot, sponsor }: SponsorSlotProps) {
  if (sponsor) {
    const safeImage = isSafeImageUrl(sponsor.imageUrl) ? sponsor.imageUrl : null
    return (
      <a
        href={appendUtm(sponsor.url)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/70"
      >
        {safeImage ? (
          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-background ring-1 ring-border/50">
            <Image
              src={safeImage}
              alt={sponsor.name}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-[12px] font-semibold text-muted-foreground ring-1 ring-border/50">
            {sponsor.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[13px] font-medium">
            {sponsor.name}
            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
          <p className="truncate text-[12px] text-muted-foreground/70">
            {sponsor.tagline}
          </p>
        </div>
      </a>
    )
  }

  return (
    <Link
      href={`/sponsor?slot=${slot}`}
      className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/70"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-[11px] font-medium text-muted-foreground/40 ring-1 ring-border/50">
        {slot}
      </div>
      <p className="text-[12px] text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
        Your ad here
      </p>
    </Link>
  )
}

export async function SponsorSlots() {
  const [slotCount, today] = await Promise.all([
    getSettingNumber("sponsor_slot_count"),
    Promise.resolve(format(new Date(), "yyyy-MM-dd")),
  ])

  const activeSponsors = await db
    .select()
    .from(sponsors)
    .where(and(lte(sponsors.startsAt, today), gte(sponsors.endsAt, today)))

  const sponsorBySlot: Record<number, Sponsor | null> = {}
  for (let i = 1; i <= slotCount; i++) sponsorBySlot[i] = null
  for (const s of activeSponsors) {
    if (s.slot <= slotCount) {
      sponsorBySlot[s.slot] = {
        name: s.name,
        tagline: s.tagline,
        url: s.websiteUrl,
        imageUrl: s.imageUrl,
      }
    }
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: slotCount }, (_, i) => i + 1).map((slot) => (
        <SponsorSlotView
          key={slot}
          slot={slot}
          sponsor={sponsorBySlot[slot]}
        />
      ))}
    </div>
  )
}
