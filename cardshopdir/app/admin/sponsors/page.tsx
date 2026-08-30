import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { Megaphone, ExternalLink, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { isSafeImageUrl } from "@/lib/images"

function getSponsorStatus(startsAt: string, endsAt: string, today: string) {
  if (startsAt > today)
    return { label: "Upcoming", className: "text-blue-500 bg-blue-500/10" }
  if (endsAt >= today)
    return { label: "Active", className: "text-emerald-500 bg-emerald-500/10" }
  return { label: "Ended", className: "text-muted-foreground/50 bg-muted" }
}

export default async function AdminSponsorsPage() {
  const allSponsors = await db
    .select()
    .from(sponsors)
    .orderBy(desc(sponsors.createdAt))

  const today = format(new Date(), "yyyy-MM-dd")

  const active = allSponsors.filter(
    (s) => s.startsAt <= today && s.endsAt >= today
  )
  const upcoming = allSponsors.filter((s) => s.startsAt > today)

  const totalRevenue = allSponsors.reduce((sum, s) => sum + s.totalCents, 0)
  const activeRevenue = active.reduce((sum, s) => sum + s.totalCents, 0)

  const fmtUsd = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100)

  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d + "T00:00:00"))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Sponsors</h1>
        <Link
          href="/admin/sponsors/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          <Plus className="h-3.5 w-3.5" />
          Add sponsor
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active", value: active.length },
          { label: "Upcoming", value: upcoming.length },
          { label: "Total campaigns", value: allSponsors.length },
          {
            label: "Total revenue",
            value: fmtUsd(totalRevenue),
            sub:
              active.length > 0 ? `${fmtUsd(activeRevenue)} active` : undefined,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-muted/30 p-4">
            <p className="text-[22px] font-semibold tracking-tight tabular-nums">
              {kpi.value}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[11px] text-muted-foreground/50">
                {kpi.label}
              </p>
              {kpi.sub && (
                <p className="text-[11px] font-medium text-emerald-500 tabular-nums">
                  {kpi.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sponsors list */}
      {allSponsors.length === 0 ? (
        <p className="py-20 text-center text-[13px] text-muted-foreground/50">
          No sponsor campaigns yet.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-[12px] font-medium tracking-wider text-muted-foreground/50 uppercase">
            {allSponsors.length} campaign{allSponsors.length !== 1 ? "s" : ""}
          </p>

          <div className="space-y-2">
            {allSponsors.map((sp) => {
              const status = getSponsorStatus(sp.startsAt, sp.endsAt, today)

              return (
                <Link
                  key={sp.id}
                  href={`/admin/sponsors/${sp.id}`}
                  className="flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  {/* Logo */}
                  {isSafeImageUrl(sp.imageUrl) ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={sp.imageUrl!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </span>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-medium">
                        {sp.name}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <span className="shrink-0 text-[11px] text-muted-foreground/50">
                        Slot {sp.slot}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {sp.email} · {fmtDate(sp.startsAt)} - {fmtDate(sp.endsAt)}{" "}
                      · {fmtUsd(sp.totalCents)}
                    </p>
                    {sp.tagline && (
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground/50">
                        {sp.tagline}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
