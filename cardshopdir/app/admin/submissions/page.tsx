import { db } from "@/lib/db"
import { submissions, user } from "@/lib/db/schema"
import { desc, asc, count, ilike, eq, or, sql } from "drizzle-orm"
import { submissionsParamsCache } from "./search-params"
import { SubmissionList } from "./submission-list"
import type { SearchParams } from "nuqs/server"

const PER_PAGE = 15

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  const { page, q, status, sort } =
    await submissionsParamsCache.parse(searchParams)

  const conditions = []
  if (q) {
    conditions.push(
      or(
        ilike(submissions.name, `%${q}%`),
        ilike(submissions.tagline, `%${q}%`),
      ),
    )
  }
  if (status) {
    conditions.push(eq(submissions.status, status))
  }

  const where =
    conditions.length === 2
      ? sql`${conditions[0]} AND ${conditions[1]}`
      : conditions[0]

  const orderBy =
    sort === "oldest"
      ? asc(submissions.createdAt)
      : sort === "name"
        ? asc(submissions.name)
        : desc(submissions.createdAt)

  const [totalResult] = await db
    .select({ count: count() })
    .from(submissions)
    .where(where)
  const total = totalResult.count
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)

  const items = await db
    .select({
      id: submissions.id,
      name: submissions.name,
      tagline: submissions.tagline,
      description: submissions.description,
      websiteUrl: submissions.websiteUrl,
      thumbnailUrl: submissions.thumbnailUrl,
      logoUrl: submissions.logoUrl,
      tier: submissions.tier,
      status: submissions.status,
      scheduledWeek: submissions.scheduledWeek,
      scheduledYear: submissions.scheduledYear,
      revisionReasons: submissions.revisionReasons,
      createdAt: submissions.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(submissions)
    .leftJoin(user, eq(submissions.userId, user.id))
    .where(where)
    .orderBy(orderBy)
    .limit(PER_PAGE)
    .offset((safePage - 1) * PER_PAGE)

  return (
    <SubmissionList
      submissions={items}
      total={total}
      page={safePage}
      totalPages={totalPages}
    />
  )
}
