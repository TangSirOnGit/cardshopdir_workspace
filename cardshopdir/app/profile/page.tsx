import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions, products, sponsors } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { setISOWeek, setISOWeekYear, startOfISOWeek, format } from "date-fns"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Zap, Star, ArrowUpRight, ArrowLeft, Megaphone, RotateCcw } from "lucide-react"
import { SignOutButton } from "@/components/sign-out-button"
import { UpgradeButton } from "./upgrade-button"
import { getSettingsTyped } from "@/lib/settings"
import { isSafeImageUrl } from "@/lib/images"

import { cn } from "@/lib/utils"

const TIER_BADGE = {
  free: { label: "Free", className: "text-muted-foreground/50" },
  boost: { label: "Boost", className: "text-blue-500", icon: Zap },
  highlight: { label: "Highlight", className: "text-amber-500", icon: Star },
} as const

function canUpgradeFree(sub: {
  tier: string
  status: string
  publishedAt: Date | null
}): boolean {
  if (sub.tier !== "free") return false
  if (sub.publishedAt) return false
  return sub.status === "pending" || sub.status === "accepted"
}

function formatScheduledDate(week: number, year: number): string {
  const monday = startOfISOWeek(
    setISOWeek(setISOWeekYear(new Date(), year), week)
  )
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(monday)
}

function getStatusDisplay(sub: {
  status: string
  tier: string
  publishedAt: Date | null
  scheduledWeek: number | null
  scheduledYear: number | null
  productSlug: string | null
  productVoteCount: number | null
}) {
  switch (sub.status) {
    case "draft":
      return {
        label: "Payment incomplete",
        className: "text-amber-500",
        href: "/submit?retry=true",
      }
    case "pending":
      if (sub.tier === "highlight") {
        return { label: "Publishing...", className: "text-blue-500" }
      }
      if (sub.tier === "boost") {
        const boostDate =
          sub.scheduledWeek && sub.scheduledYear
            ? ` (${formatScheduledDate(sub.scheduledWeek, sub.scheduledYear)})`
            : ""
        return {
          label: `Guaranteed in the next batch${boostDate}`,
          className: "text-emerald-500",
        }
      }
      return { label: "Under review", className: "text-blue-500" }
    case "revision":
      return { label: "Revision requested", className: "text-orange-500" }
    case "accepted":
      if (sub.publishedAt && sub.productSlug) {
        const votes = sub.productVoteCount ?? 0
        return {
          label: `Live · ${votes} vote${votes !== 1 ? "s" : ""}`,
          className: "text-emerald-500",
          href: `/p/${sub.productSlug}`,
        }
      }
      if (sub.scheduledWeek && sub.scheduledYear) {
        return {
          label: `Approved, launching ${formatScheduledDate(sub.scheduledWeek, sub.scheduledYear)}`,
          className: "text-emerald-500",
        }
      }
      return {
        label: "Approved, launch date coming soon",
        className: "text-emerald-500",
      }
    case "rejected":
      return {
        label:
          sub.tier !== "free"
            ? "Not accepted, refund in process"
            : "Not accepted",
        className: "text-muted-foreground/50",
      }
    default:
      return { label: sub.status, className: "text-muted-foreground/50" }
  }
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/")
  }

  const { user } = session

  const [userSubmissions, userSponsors, settings] = await Promise.all([
    db
      .select({
        id: submissions.id,
        name: submissions.name,
        tagline: submissions.tagline,
        websiteUrl: submissions.websiteUrl,
        description: submissions.description,
        thumbnailUrl: submissions.thumbnailUrl,
        tier: submissions.tier,
        status: submissions.status,
        revisionReasons: submissions.revisionReasons,
        publishedAt: submissions.publishedAt,
        scheduledWeek: submissions.scheduledWeek,
        scheduledYear: submissions.scheduledYear,
        createdAt: submissions.createdAt,
        productSlug: products.slug,
        productVoteCount: products.voteCount,
      })
      .from(submissions)
      .leftJoin(products, eq(submissions.productId, products.id))
      .where(eq(submissions.userId, user.id))
      .orderBy(desc(submissions.createdAt)),
    db
      .select()
      .from(sponsors)
      .where(eq(sponsors.userId, user.id))
      .orderBy(desc(sponsors.createdAt)),
    getSettingsTyped(),
  ])

  const boostPrice = `$${(settings.boostPriceCents / 100).toFixed(0)}`
  const highlightPrice = `$${(settings.highlightPriceCents / 100).toFixed(0)}`

  const today = format(new Date(), "yyyy-MM-dd")

  function getSponsorStatus(s: { startsAt: string; endsAt: string }) {
    if (s.startsAt > today)
      return { label: "Upcoming", className: "text-blue-500" }
    if (s.endsAt >= today)
      return { label: "Active", className: "text-emerald-500" }
    return { label: "Ended", className: "text-muted-foreground/50" }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pt-2 sm:pt-4">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4 px-3">
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-full"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{user.name}</p>
          <p className="truncate text-[12px] text-muted-foreground/50">
            {user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="space-y-8">
      {/* Submissions */}
      <section className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
          Submissions
        </p>
        {userSubmissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
            <p className="text-[13px] text-muted-foreground/50">
              No submissions yet.
            </p>
            <Link
              href="/submit"
              className="mt-3 inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
            >
              Submit a product
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {userSubmissions.map((sub) => {
            const badge =
              TIER_BADGE[sub.tier as keyof typeof TIER_BADGE] ?? TIER_BADGE.free
            const BadgeIcon = "icon" in badge ? badge.icon : null
            const status = getStatusDisplay(sub)

            const rowClass =
              "flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"

            const content = (
              <>
                {/* Thumbnail */}
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={sub.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>

                {/* Info — left */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium">
                      {sub.name}
                    </span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-0.5 text-[11px] font-medium",
                        badge.className
                      )}
                    >
                      {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                      {badge.label}
                    </span>
                  </div>
                  <p className={cn("mt-0.5 text-[12px]", status.className)}>
                    {status.label}
                  </p>
                  {sub.status === "revision" && (
                    <div className="mt-2">
                      <Link
                        href={`/profile/revision/${sub.id}`}
                        className="inline-flex items-center rounded-lg bg-foreground px-3 py-1.5 text-[12px] font-medium text-background transition-opacity hover:opacity-80"
                      >
                        Edit &amp; resubmit
                      </Link>
                    </div>
                  )}
                  {canUpgradeFree(sub) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <UpgradeButton
                        submissionId={sub.id}
                        tier="boost"
                        price={boostPrice}
                      />
                      <UpgradeButton
                        submissionId={sub.id}
                        tier="highlight"
                        price={highlightPrice}
                      />
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {status.href && (
                  <ArrowUpRight className="mr-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
              </>
            )

            return (
              <div key={sub.id}>
                {status.href ? (
                  <Link href={status.href} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </div>
            )
          })}
          </div>
        )}
      </section>

      {/* Sponsor campaigns */}
      <section className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
          Sponsorships
        </p>
        {userSponsors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
            <p className="text-[13px] text-muted-foreground/50">
              No sponsorships yet.
            </p>
            <Link
              href="/sponsor"
              className="mt-3 inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
            >
              Become a sponsor
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {userSponsors.map((sp) => {
              const spStatus = getSponsorStatus(sp)
              const showRenew = spStatus.label === "Ended"
              const renewParams = new URLSearchParams({
                renew: String(sp.id),
                name: sp.name,
                tagline: sp.tagline,
                url: sp.websiteUrl,
                ...(sp.imageUrl ? { image: sp.imageUrl } : {}),
              })
              const fmtDate = (d: string) =>
                new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(d + "T00:00:00"))

              return (
                <div
                  key={sp.id}
                  className="flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  {isSafeImageUrl(sp.imageUrl) ? (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                      <Image
                        src={sp.imageUrl!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border/50">
                      <Megaphone className="h-4 w-4 text-muted-foreground/50" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-medium">
                        {sp.name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          spStatus.label === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : spStatus.label === "Upcoming"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            spStatus.label === "Active" && "bg-emerald-500",
                            spStatus.label === "Upcoming" && "bg-blue-500",
                            spStatus.label === "Ended" && "bg-muted-foreground/50",
                          )}
                        />
                        {spStatus.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {fmtDate(sp.startsAt)} &ndash; {fmtDate(sp.endsAt)}
                      <span className="text-muted-foreground/40"> &middot; </span>
                      Slot {sp.slot}
                      <span className="text-muted-foreground/40"> &middot; </span>
                      ${(sp.totalCents / 100).toFixed(2)}
                    </p>
                  </div>

                  {showRenew && (
                    <Link
                      href={`/sponsor?${renewParams.toString()}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <RotateCcw className="size-3" />
                      Renew
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
