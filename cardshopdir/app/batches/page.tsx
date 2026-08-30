import { db } from "@/lib/db"
import { batches } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { setISOWeek, setISOWeekYear, startOfISOWeek } from "date-fns"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import { getSetting } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting("site_name")
  return {
    title: `All Batches · Weekly product launches on ${siteName}`,
    description: `Browse every weekly batch of product launches on ${siteName}. A curated directory of the best new tools, organized by week.`,
    alternates: { canonical: "/batches" },
  }
}

export default async function BatchesPage() {
  const allBatches = await db.query.batches.findMany({
    orderBy: [desc(batches.year), desc(batches.weekNumber)],
  })

  if (allBatches.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[13px] text-muted-foreground">No batches yet.</p>
      </div>
    )
  }

  const byYear = allBatches.reduce(
    (acc, batch) => {
      if (!acc[batch.year]) acc[batch.year] = []
      acc[batch.year].push(batch)
      return acc
    },
    {} as Record<number, typeof allBatches>,
  )

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pt-2 sm:pt-4">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="mt-3 font-serif text-2xl tracking-tight">
          All batches
        </h1>
      </div>

      {years.map((year) => (
        <div key={year}>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {year}
          </p>
          <div className="divide-y divide-border">
            {byYear[year].map((batch) => (
              <Link
                key={batch.id}
                href={`/batches/${batch.year}/${batch.weekNumber}`}
                className="flex items-center justify-between py-2.5 text-[14px] transition-opacity hover:opacity-60"
              >
                <span className="font-medium">Week {batch.weekNumber}</span>
                <span className="text-[12px] text-muted-foreground">
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                  }).format(
                    startOfISOWeek(
                      setISOWeek(
                        setISOWeekYear(new Date(), batch.year),
                        batch.weekNumber,
                      ),
                    ),
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
