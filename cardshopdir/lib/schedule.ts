import { count, eq, and, isNull } from "drizzle-orm"
import {
  getISOWeek,
  getISOWeekYear,
  addWeeks,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
} from "date-fns"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { getSettingNumber } from "@/lib/settings"

export async function findNextAvailableWeek(
  tier: string,
): Promise<{ week: number; year: number }> {
  const now = new Date()
  const nextWeekDate = addWeeks(now, 1)
  const startWeek = getISOWeek(nextWeekDate)
  const startYear = getISOWeekYear(nextWeekDate)

  if (tier !== "free") {
    return { week: startWeek, year: startYear }
  }

  const freeSlotsPerBatch = await getSettingNumber("free_slots_per_batch")

  for (let i = 0; i < 52; i++) {
    const d = addWeeks(nextWeekDate, i)
    const w = getISOWeek(d)
    const y = getISOWeekYear(d)

    const [result] = await db
      .select({ count: count() })
      .from(submissions)
      .where(
        and(
          eq(submissions.scheduledWeek, w),
          eq(submissions.scheduledYear, y),
          eq(submissions.tier, "free"),
          eq(submissions.status, "accepted"),
          isNull(submissions.publishedAt),
        ),
      )

    if (result.count < freeSlotsPerBatch) {
      return { week: w, year: y }
    }
  }

  const fallback = addWeeks(now, 52)
  return { week: getISOWeek(fallback), year: getISOWeekYear(fallback) }
}

export function getMondayOfWeek(week: number, year: number): Date {
  return startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), week))
}

export function formatLaunchDate(week: number, year: number): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(getMondayOfWeek(week, year))
}
