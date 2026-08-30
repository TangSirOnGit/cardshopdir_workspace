"use server"

import { revalidatePath } from "next/cache"
import { eq, and, count, isNull } from "drizzle-orm"
import { previousSunday, isSunday, addWeeks, getISOWeek, getISOWeekYear } from "date-fns"
import { requireAdmin } from "@/lib/admin"
import { db } from "@/lib/db"
import { submissions, products, user } from "@/lib/db/schema"
import { getStripePaymentUrl } from "@/lib/stripe-refund"
import { SITE_URL } from "@/config"
import { findNextAvailableWeek, formatLaunchDate, getMondayOfWeek } from "@/lib/schedule"
import { getSettingNumber } from "@/lib/settings"
import {
  sendSubmissionAcceptedEmail,
  sendSubmissionRejectedEmail,
  sendSubmissionRevisionEmail,
} from "@/lib/emails"

// ── Submission actions ──────────────────────────────────────────────────────

export async function getAvailableWeeks(tier: string) {
  await requireAdmin()

  const freeSlotsPerBatch = await getSettingNumber("free_slots_per_batch")
  const now = new Date()
  const weeks: {
    week: number
    year: number
    label: string
    slotsUsed: number
    slotsTotal: number
    isRecommended: boolean
  }[] = []

  const MIN_WEEKS = 8
  const MIN_AVAILABLE = 4
  const MAX_WEEKS = 104

  let recommended: { week: number; year: number } | null = null
  let availableCount = 0

  for (let i = 1; i <= MAX_WEEKS; i++) {
    const d = addWeeks(now, i)
    const w = getISOWeek(d)
    const y = getISOWeekYear(d)
    const monday = getMondayOfWeek(w, y)
    const label = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(monday)

    const [result] = await db
      .select({ count: count() })
      .from(submissions)
      .where(
        and(
          eq(submissions.scheduledWeek, w),
          eq(submissions.scheduledYear, y),
          eq(submissions.status, "accepted"),
          isNull(submissions.publishedAt),
        ),
      )

    const slotsUsed = result.count
    const slotsTotal =
      tier === "free" ? freeSlotsPerBatch : 999
    const hasSlot = tier !== "free" || slotsUsed < slotsTotal

    if (hasSlot) {
      availableCount++
      if (!recommended) recommended = { week: w, year: y }
    }

    weeks.push({
      week: w,
      year: y,
      label: `W${w}, ${label}`,
      slotsUsed,
      slotsTotal,
      isRecommended: false,
    })

    if (i >= MIN_WEEKS && availableCount >= MIN_AVAILABLE) break
  }

  if (recommended) {
    const match = weeks.find(
      (w) => w.week === recommended!.week && w.year === recommended!.year,
    )
    if (match) match.isRecommended = true
  }

  return weeks
}

export async function acceptSubmission(
  id: number,
  scheduledWeek: number,
  scheduledYear: number,
) {
  await requireAdmin()

  const submission = await db
    .select({
      name: submissions.name,
      tier: submissions.tier,
      userEmail: user.email,
    })
    .from(submissions)
    .leftJoin(user, eq(submissions.userId, user.id))
    .where(eq(submissions.id, id))
    .then((rows) => rows[0])

  if (!submission) throw new Error("Submission not found")

  await db
    .update(submissions)
    .set({
      status: "accepted" as const,
      scheduledWeek,
      scheduledYear,
    })
    .where(eq(submissions.id, id))

  if (submission.userEmail && submission.tier === "free") {
    const launchInfo = `on ${formatLaunchDate(scheduledWeek, scheduledYear)}`
    sendSubmissionAcceptedEmail(
      submission.userEmail,
      submission.name,
      "free",
      launchInfo,
      `${SITE_URL}/profile`,
    ).catch(console.error)
  }

  revalidatePath("/admin/submissions")

  return { ok: true }
}

export async function updateSubmissionStatus(
  id: number,
  status: "accepted" | "rejected" | "revision" | "pending",
  revisionReasons?: string[],
) {
  await requireAdmin()

  if (!["accepted", "rejected", "revision", "pending"].includes(status)) {
    throw new Error("Invalid status")
  }

  const submission = await db
    .select({
      name: submissions.name,
      tier: submissions.tier,
      stripeSessionId: submissions.stripeSessionId,
      scheduledWeek: submissions.scheduledWeek,
      scheduledYear: submissions.scheduledYear,
      userEmail: user.email,
    })
    .from(submissions)
    .leftJoin(user, eq(submissions.userId, user.id))
    .where(eq(submissions.id, id))
    .then((rows) => rows[0])

  if (!submission) throw new Error("Submission not found")

  // If rejecting a paid submission, get the Stripe payment URL for manual refund
  let stripePaymentUrl: string | null = null
  if (
    status === "rejected" &&
    submission.tier !== "free" &&
    submission.stripeSessionId
  ) {
    stripePaymentUrl = await getStripePaymentUrl(id)
  }

  // Auto-assign schedule when accepting (skip if already scheduled, e.g. boost at payment)
  let schedule: { week: number; year: number } | null = null
  if (status === "accepted" && !submission.scheduledWeek) {
    schedule = await findNextAvailableWeek(submission.tier)
  }

  await db
    .update(submissions)
    .set({
      status,
      ...(schedule
        ? { scheduledWeek: schedule.week, scheduledYear: schedule.year }
        : {}),
      ...(status === "revision" && revisionReasons
        ? { revisionReasons: JSON.stringify(revisionReasons) }
        : {}),
    })
    .where(eq(submissions.id, id))

  // Send email notification (fire-and-forget)
  if (submission.userEmail) {
    if (status === "accepted" && schedule && submission.tier === "free") {
      // Only free submissions get an accepted email.
      // Boost already received "guaranteed in next batch" at payment.
      // Highlight is already live at payment.
      const launchInfo = `on ${formatLaunchDate(schedule.week, schedule.year)}`

      sendSubmissionAcceptedEmail(
        submission.userEmail,
        submission.name,
        "free",
        launchInfo,
        `${SITE_URL}/profile`,
      ).catch(console.error)
    } else if (status === "rejected") {
      sendSubmissionRejectedEmail(
        submission.userEmail,
        submission.name,
        submission.tier,
      ).catch(console.error)
    } else if (status === "revision") {
      // Deadline = Sunday before the scheduled batch (batch launches Monday)
      // If already scheduled, use that week's Monday minus 1 day
      // Otherwise, use the coming Sunday of the current ISO week
      const batchMonday = submission.scheduledWeek && submission.scheduledYear
        ? getMondayOfWeek(submission.scheduledWeek, submission.scheduledYear)
        : getMondayOfWeek(
            ...Object.values(await findNextAvailableWeek(submission.tier)) as [number, number]
          )
      const sundayBefore = isSunday(batchMonday)
        ? batchMonday
        : previousSunday(batchMonday)
      const deadline = new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(sundayBefore)
      sendSubmissionRevisionEmail(
        submission.userEmail,
        submission.name,
        deadline,
        revisionReasons ?? [],
        `${SITE_URL}/profile`,
      ).catch(console.error)
    }
  }

  revalidatePath("/admin/submissions")

  return { ok: true, schedule, stripePaymentUrl }
}

export async function deleteSubmission(id: number) {
  await requireAdmin()

  const submission = await db
    .select({
      productId: submissions.productId,
    })
    .from(submissions)
    .where(eq(submissions.id, id))
    .then((rows) => rows[0])

  if (!submission) throw new Error("Submission not found")

  // If this submission was already published, delete the product too
  if (submission.productId) {
    await db.delete(products).where(eq(products.id, submission.productId))
  }

  await db.delete(submissions).where(eq(submissions.id, id))

  revalidatePath("/admin/submissions")
  revalidatePath("/admin/products")
  revalidatePath("/")

  return { ok: true }
}

export async function updateSubmissionFields(
  id: number,
  data: {
    name?: string
    tagline?: string
    description?: string
    websiteUrl?: string
    thumbnailUrl?: string
  },
) {
  await requireAdmin()

  const updates: Record<string, string> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.tagline !== undefined) updates.tagline = data.tagline
  if (data.description !== undefined) updates.description = data.description
  if (data.websiteUrl !== undefined) updates.websiteUrl = data.websiteUrl
  if (data.thumbnailUrl !== undefined) updates.thumbnailUrl = data.thumbnailUrl

  if (Object.keys(updates).length > 0) {
    await db.update(submissions).set(updates).where(eq(submissions.id, id))
  }

  revalidatePath("/admin/submissions")

  return { ok: true }
}

export async function updateSubmissionThumbnail(id: number, thumbnailUrl: string) {
  await requireAdmin()

  await db
    .update(submissions)
    .set({ thumbnailUrl })
    .where(eq(submissions.id, id))

  revalidatePath("/admin/submissions")

  return { ok: true }
}

// ── Product actions ─────────────────────────────────────────────────────────

export async function updateProduct(
  id: number,
  data: { name?: string; websiteUrl?: string; thumbnailUrl?: string },
) {
  await requireAdmin()

  const updates: Record<string, string> = {}
  if (data.name) {
    updates.name = data.name
    updates.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }
  if (data.websiteUrl) updates.websiteUrl = data.websiteUrl
  if (data.thumbnailUrl) updates.thumbnailUrl = data.thumbnailUrl

  await db.update(products).set(updates).where(eq(products.id, id))

  revalidatePath("/admin/products")
  revalidatePath("/")

  return { ok: true }
}

export async function updateProductLogo(id: number, logoUrl: string) {
  await requireAdmin()

  await db
    .update(products)
    .set({ logoUrl: logoUrl || null })
    .where(eq(products.id, id))

  revalidatePath("/admin/products")
  revalidatePath("/")

  return { ok: true }
}

export async function deleteProduct(id: number) {
  await requireAdmin()

  await db.delete(products).where(eq(products.id, id))

  revalidatePath("/admin/products")
  revalidatePath("/")

  return { ok: true }
}
