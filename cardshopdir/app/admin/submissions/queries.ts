import { db } from "@/lib/db"
import { submissions, user } from "@/lib/db/schema"
import { eq, desc, and, isNull, sql } from "drizzle-orm"

export type Submission = Awaited<ReturnType<typeof getSubmissionsByStatus>>[number]

export async function getSubmissionsByStatus(
  status: "draft" | "pending" | "revision" | "accepted" | "rejected",
) {
  return db
    .select({
      id: submissions.id,
      name: submissions.name,
      tagline: submissions.tagline,
      description: submissions.description,
      websiteUrl: submissions.websiteUrl,
      thumbnailUrl: submissions.thumbnailUrl,
      tier: submissions.tier,
      status: submissions.status,
      publishedAt: submissions.publishedAt,
      scheduledWeek: submissions.scheduledWeek,
      scheduledYear: submissions.scheduledYear,
      productId: submissions.productId,
      createdAt: submissions.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(submissions)
    .leftJoin(user, eq(submissions.userId, user.id))
    .where(eq(submissions.status, status))
    .orderBy(desc(submissions.createdAt))
}

export type WeekGroup = {
  week: number
  year: number
  items: Submission[]
}

export async function getAcceptedGrouped() {
  const all = await getSubmissionsByStatus("accepted")

  const unpublished = all
    .filter((s) => !s.publishedAt)
    .sort((a, b) => {
      if (a.scheduledWeek && b.scheduledWeek) {
        const aKey = (a.scheduledYear ?? 0) * 100 + a.scheduledWeek
        const bKey = (b.scheduledYear ?? 0) * 100 + b.scheduledWeek
        if (aKey !== bKey) return aKey - bKey
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  const published = all.filter((s) => s.publishedAt)

  const scheduled = unpublished.filter((s) => s.scheduledWeek !== null)
  const firstWeek =
    scheduled.length > 0
      ? { week: scheduled[0].scheduledWeek!, year: scheduled[0].scheduledYear! }
      : null

  const nextBatch = firstWeek
    ? unpublished.filter(
        (s) => s.scheduledWeek === firstWeek.week && s.scheduledYear === firstWeek.year,
      )
    : []

  // Group later submissions by week
  const laterMap = new Map<string, WeekGroup>()
  for (const s of unpublished) {
    if (
      s.scheduledWeek === null ||
      (firstWeek &&
        s.scheduledWeek === firstWeek.week &&
        s.scheduledYear === firstWeek.year)
    )
      continue
    const key = `${s.scheduledYear}-${s.scheduledWeek}`
    if (!laterMap.has(key)) {
      laterMap.set(key, { week: s.scheduledWeek!, year: s.scheduledYear!, items: [] })
    }
    laterMap.get(key)!.items.push(s)
  }
  const laterWeeks = Array.from(laterMap.values()).sort(
    (a, b) => a.year * 100 + a.week - (b.year * 100 + b.week),
  )

  return { nextBatch, laterWeeks, published, firstWeek }
}

export async function getCalendarData() {
  return db
    .select({
      week: submissions.scheduledWeek,
      year: submissions.scheduledYear,
      tier: submissions.tier,
      count: sql<number>`count(*)::int`,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.status, "accepted"),
        isNull(submissions.publishedAt),
        sql`${submissions.scheduledWeek} IS NOT NULL`,
      ),
    )
    .groupBy(submissions.scheduledWeek, submissions.scheduledYear, submissions.tier)
}
