import { db } from "@/lib/db"
import { submissions, products, user, votes, batches } from "@/lib/db/schema"
import { eq, count, sql, gte, and } from "drizzle-orm"
import {
  getISOWeek,
  getISOWeekYear,
  addWeeks,
  startOfISOWeek,
  setISOWeek,
  setISOWeekYear,
  subDays,
} from "date-fns"
import { getSettingsTyped } from "@/lib/settings"
import { getCalendarData } from "./submissions/queries"
import { BatchCalendar } from "./submissions/calendar/batch-calendar"
import { GradientBarMultipleChart } from "@/components/ui/gradient-bar-multiple-chart"
import { GradientRoundedAreaChart } from "@/components/ui/gradient-rounded-chart"
import { RoundedPieChart } from "@/components/ui/rounded-pie-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AdminDashboardPage() {
  const settings = await getSettingsTyped()
  const now = new Date()
  const oneDayAgo = subDays(now, 1)
  const thirtyDaysAgo = subDays(now, 30)
  const currentIsoWeek = getISOWeek(now)
  const currentIsoYear = getISOWeekYear(now)

  const [
    pendingCount,
    revisionCount,
    boostCount,
    highlightCount,
    totalProducts,
    totalUsers,
    totalVotes,
    currentBatchVotes,
    productsLast24h,
    usersLast24h,
    paidLast30d,
    calendarData,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.status, "pending"))
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.status, "revision"))
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(submissions)
      .where(sql`${submissions.tier} = 'boost' and ${submissions.stripeSessionId} is not null`)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(submissions)
      .where(sql`${submissions.tier} = 'highlight' and ${submissions.stripeSessionId} is not null`)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(products)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(user)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(votes)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(votes)
      .innerJoin(products, eq(votes.productId, products.id))
      .innerJoin(batches, eq(products.batchId, batches.id))
      .where(
        and(
          eq(batches.weekNumber, currentIsoWeek),
          eq(batches.year, currentIsoYear),
        ),
      )
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(products)
      .where(gte(products.createdAt, oneDayAgo))
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, oneDayAgo))
      .then((r) => r[0].count),
    db
      .select({
        tier: submissions.tier,
        count: count(),
      })
      .from(submissions)
      .where(
        sql`${submissions.createdAt} >= ${thirtyDaysAgo.toISOString()} and ${submissions.tier} in ('boost','highlight') and ${submissions.stripeSessionId} is not null`,
      )
      .groupBy(submissions.tier),
    getCalendarData(),
  ])

  // Last 6 months: new users + paid submissions (boost + highlight)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const sixMonthsAgoIso = sixMonthsAgo.toISOString()

  const userMonthExpr = sql<string>`to_char("user"."created_at", 'YYYY-MM')`
  const subMonthExpr = sql<string>`to_char("submissions"."created_at", 'YYYY-MM')`
  const subAllMonthExpr = sql<string>`to_char("submissions"."created_at", 'YYYY-MM')`
  const voteMonthExpr = sql<string>`to_char("votes"."created_at", 'YYYY-MM')`

  const [usersByMonth, paymentsByMonth, submissionsByMonth, votesByMonth, tierBreakdown] =
    await Promise.all([
      db
        .select({
          month: userMonthExpr,
          count: count(),
        })
        .from(user)
        .where(sql`${user.createdAt} >= ${sixMonthsAgoIso}`)
        .groupBy(userMonthExpr),
      db
        .select({
          month: subMonthExpr,
          count: count(),
        })
        .from(submissions)
        .where(
          sql`${submissions.createdAt} >= ${sixMonthsAgoIso} and ${submissions.tier} in ('boost','highlight') and ${submissions.stripeSessionId} is not null`,
        )
        .groupBy(subMonthExpr),
      db
        .select({
          month: subAllMonthExpr,
          count: count(),
        })
        .from(submissions)
        .where(sql`${submissions.createdAt} >= ${sixMonthsAgoIso}`)
        .groupBy(subAllMonthExpr),
      db
        .select({
          month: voteMonthExpr,
          count: count(),
        })
        .from(votes)
        .where(sql`${votes.createdAt} >= ${sixMonthsAgoIso}`)
        .groupBy(voteMonthExpr),
      db
        .select({
          tier: submissions.tier,
          count: count(),
        })
        .from(submissions)
        .where(eq(submissions.status, "accepted"))
        .groupBy(submissions.tier),
    ])

  const monthFmt = new Intl.DateTimeFormat("en", { month: "long" })
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return {
      label: monthFmt.format(d),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    }
  })

  const chartData = months.map(({ label, key }) => ({
    month: label,
    desktop: usersByMonth.find((r) => r.month === key)?.count ?? 0,
    mobile: paymentsByMonth.find((r) => r.month === key)?.count ?? 0,
  }))

  const activityData = months.map(({ label, key }) => ({
    month: label,
    desktop: submissionsByMonth.find((r) => r.month === key)?.count ?? 0,
    mobile: votesByMonth.find((r) => r.month === key)?.count ?? 0,
  }))

  const tierData = [
    {
      browser: "free",
      label: "Free",
      visitors: tierBreakdown.find((r) => r.tier === "free")?.count ?? 0,
      fill: "var(--chart-1)",
    },
    {
      browser: "boost",
      label: "Boost",
      visitors: tierBreakdown.find((r) => r.tier === "boost")?.count ?? 0,
      fill: "var(--chart-2)",
    },
    {
      browser: "highlight",
      label: "Highlight",
      visitors: tierBreakdown.find((r) => r.tier === "highlight")?.count ?? 0,
      fill: "var(--chart-3)",
    },
  ].filter((d) => d.visitors > 0)


  // Build calendar weeks
  const nextWeekDate = addWeeks(now, 1)
  const currentWeek = getISOWeek(nextWeekDate)
  const currentYear = getISOWeekYear(nextWeekDate)

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const d = addWeeks(nextWeekDate, i)
    const week = getISOWeek(d)
    const year = getISOWeekYear(d)
    const monday = startOfISOWeek(
      setISOWeek(setISOWeekYear(new Date(), year), week),
    )

    const free = calendarData
      .filter((r) => r.week === week && r.year === year && r.tier === "free")
      .reduce((sum, r) => sum + r.count, 0)
    const boost = calendarData
      .filter((r) => r.week === week && r.year === year && r.tier === "boost")
      .reduce((sum, r) => sum + r.count, 0)
    const highlight = calendarData
      .filter(
        (r) => r.week === week && r.year === year && r.tier === "highlight",
      )
      .reduce((sum, r) => sum + r.count, 0)

    return {
      week,
      year,
      monday: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(monday),
      free,
      boost,
      highlight,
      freeSlots: settings.freeSlotsPerBatch - free,
      isCurrentWeek: week === currentWeek && year === currentYear,
    }
  })

  const fmtUsd = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100)

  type Kpi = {
    label: string
    value: string | number
    sub?: string
    href?: string
  }

  const kpis: Kpi[] = [
    {
      label: "Pending review",
      value: pendingCount,
      href: "/admin/submissions",
    },
    {
      label: "Awaiting revision",
      value: revisionCount,
      href: "/admin/submissions?status=revision",
    },
    {
      label: "Boosts sold",
      value: boostCount,
    },
    {
      label: "Highlights sold",
      value: highlightCount,
    },
    {
      label: "Total revenue",
      value: fmtUsd(
        boostCount * settings.boostPriceCents +
          highlightCount * settings.highlightPriceCents,
      ),
      sub: `+${fmtUsd(
        (paidLast30d.find((r) => r.tier === "boost")?.count ?? 0) *
          settings.boostPriceCents +
          (paidLast30d.find((r) => r.tier === "highlight")?.count ?? 0) *
            settings.highlightPriceCents,
      )} (30d)`,
    },
    {
      label: "Votes",
      value: totalVotes,
      sub: `+${currentBatchVotes} this batch`,
    },
    {
      label: "Total products",
      value: totalProducts,
      sub: `+${productsLast24h} (24h)`,
    },
    {
      label: "Total users",
      value: totalUsers,
      sub: `+${usersLast24h} (24h)`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const content = (
            <>
              <p className="text-[22px] font-semibold tabular-nums tracking-tight">
                {kpi.value}
              </p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-[11px] text-muted-foreground/50">
                  {kpi.label}
                </p>
                {kpi.sub && (
                  <p className="text-[11px] font-medium tabular-nums text-emerald-500">
                    {kpi.sub}
                  </p>
                )}
              </div>
            </>
          )

          return kpi.href ? (
            <a
              key={kpi.label}
              href={kpi.href}
              className="rounded-2xl bg-muted/30 p-4 transition-colors hover:bg-muted/50"
            >
              {content}
            </a>
          ) : (
            <div
              key={kpi.label}
              className="rounded-2xl bg-muted/30 p-4"
            >
              {content}
            </div>
          )
        })}
      </div>

      {/* Growth charts */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <GradientBarMultipleChart
          data={chartData}
          title="Users & payments"
          description="Last 6 months"
          seriesALabel="New users"
          seriesBLabel="Payments"
        />
        <GradientRoundedAreaChart
          data={activityData}
          title="Activity"
          description="Last 6 months"
          seriesALabel="Submissions"
          seriesBLabel="Votes"
        />
        <RoundedPieChart
          data={tierData}
          title="Tier breakdown"
          description="Accepted submissions"
          valueLabel="Submissions"
        />
      </div>

      {/* Calendar */}
      <Card className="ring-0 shadow-none" size="sm">
        <CardHeader>
          <CardTitle>Batch schedule</CardTitle>
          <CardDescription>Next 8 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchCalendar weeks={weeks} freePerBatch={settings.freeSlotsPerBatch} />
        </CardContent>
      </Card>
    </div>
  )
}
