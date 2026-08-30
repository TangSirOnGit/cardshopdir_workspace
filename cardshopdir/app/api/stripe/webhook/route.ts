import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { env } from "@/lib/env"
import { db } from "@/lib/db"
import { submissions, products, batches, user, sponsors } from "@/lib/db/schema"
import { eq, and, desc, isNull, lte, gte, sql } from "drizzle-orm"
import { getISOWeek, getISOWeekYear } from "date-fns"
import Stripe from "stripe"
import { getSettingNumber } from "@/lib/settings"
import { findNextAvailableWeek, formatLaunchDate } from "@/lib/schedule"
import { sendPaymentConfirmedEmail, sendSubmissionPublishedEmail, sendSponsorConfirmedEmail } from "@/lib/emails"
import { cacheFavicon } from "@/lib/images"
import { notifyDiscord } from "@/lib/discord"
import { revalidatePath } from "next/cache"

/** Ensure the submission has a cached logo before we copy it into a product.
 * `cacheFavicon` is normally fire-and-forget at submission time — if a user
 * pays for Highlight immediately after submitting, the favicon may not be
 * cached yet. In that case, fetch + persist it synchronously here. */
async function ensureLogoUrl(
  submissionId: number,
  existing: string | null,
  websiteUrl: string,
): Promise<string | null> {
  if (existing) return existing
  const fetched = await cacheFavicon(websiteUrl).catch(() => null)
  if (fetched) {
    await db
      .update(submissions)
      .set({ logoUrl: fetched })
      .where(eq(submissions.id, submissionId))
  }
  return fetched
}

/** Outcome of atomically claiming a Checkout Session for a submission. */
type ClaimResult = "claimed" | "duplicate" | "conflict" | "missing"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Stamp `sessionId` onto the submission, atomically.
 *
 * Stripe retries webhooks and can deliver the same event concurrently. A
 * `SELECT` followed by an `UPDATE` lets two deliveries both observe "not
 * processed yet" and both publish. This single conditional UPDATE cannot:
 * Postgres locks the row, so exactly one caller sees a row returned, and the
 * unique index on `stripe_session_id` backs it up.
 *
 * Always call this inside the transaction that also does the fulfilment.
 * Claiming in its own transaction is worse than the race it fixes: if
 * fulfilment then fails, the claim is already committed, every Stripe retry
 * short-circuits as "duplicate", and the customer is charged and never served.
 */
async function claimSession(
  tx: Tx,
  submissionId: number,
  sessionId: string,
): Promise<ClaimResult> {
  const claimed = await tx
    .update(submissions)
    .set({ stripeSessionId: sessionId })
    .where(
      and(
        eq(submissions.id, submissionId),
        isNull(submissions.stripeSessionId),
      ),
    )
    .returning({ id: submissions.id })

  if (claimed.length > 0) return "claimed"

  const row = await tx
    .select({ sessionId: submissions.stripeSessionId })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .then((r) => r[0])

  if (!row) return "missing"
  return row.sessionId === sessionId ? "duplicate" : "conflict"
}

/** A submission row as returned by `db.query.submissions.findFirst`. */
type SubmissionRow = NonNullable<
  Awaited<ReturnType<typeof db.query.submissions.findFirst>>
>

/** Get the current ISO week's batch, creating it when this is the first entry. */
async function getOrCreateCurrentBatch(now: Date) {
  const currentWeek = getISOWeek(now)
  const currentYear = getISOWeekYear(now)

  const existing = await db.query.batches.findFirst({
    where: and(
      eq(batches.weekNumber, currentWeek),
      eq(batches.year, currentYear),
    ),
    orderBy: desc(batches.createdAt),
  })
  if (existing) return existing

  const [created] = await db
    .insert(batches)
    .values({ weekNumber: currentWeek, year: currentYear })
    .returning()
  return created
}

type PublishResult =
  | { status: "published"; slug: string }
  | { status: Exclude<ClaimResult, "claimed"> }

/**
 * Claim the Checkout Session and publish a paid Highlight submission into the
 * current week's batch, in one transaction.
 *
 * Both paid paths — a free submission upgrading to Highlight, and one that
 * paid for Highlight up front — end here. They used to carry a copy of this
 * logic each, which is how they drifted apart.
 *
 * Everything slow or networked happens before the transaction opens, so the
 * only work inside it is the writes that must land together.
 */
async function claimAndPublishHighlight(
  submission: SubmissionRow,
  sessionId: string,
  paymentIntentId: string,
): Promise<PublishResult> {
  const now = new Date()
  const batch = await getOrCreateCurrentBatch(now)

  const baseSlug = submission.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const existing = await db.query.products.findFirst({
    where: eq(products.slug, baseSlug),
  })
  const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

  const resolvedLogoUrl = await ensureLogoUrl(
    submission.id,
    submission.logoUrl,
    submission.websiteUrl,
  )

  const highlightDurationDays = await getSettingNumber(
    "highlight_duration_days",
  )

  const result = await db.transaction(async (tx): Promise<PublishResult> => {
    const claim = await claimSession(tx, submission.id, sessionId)
    if (claim !== "claimed") return { status: claim }

    const [newProduct] = await tx
      .insert(products)
      .values({
        batchId: batch.id,
        name: submission.name,
        slug: finalSlug,
        tagline: submission.tagline,
        description: submission.description,
        thumbnailUrl: submission.thumbnailUrl,
        logoUrl: resolvedLogoUrl,
        websiteUrl: submission.websiteUrl,
        tier: "highlight",
        position: 0,
        dofollow: true,
        stripePaymentId: paymentIntentId,
        highlightExpiresAt: new Date(
          now.getTime() + highlightDurationDays * 24 * 60 * 60 * 1000,
        ),
      })
      .returning()

    await tx
      .update(submissions)
      .set({
        tier: "highlight",
        status: "accepted",
        publishedAt: now,
        productId: newProduct.id,
      })
      .where(eq(submissions.id, submission.id))

    return { status: "published", slug: finalSlug }
  })

  if (result.status === "published") revalidatePath("/")
  return result
}

/** Log and announce a payment that could not be fulfilled, so a human sees it. */
async function reportUnfulfilled(message: string) {
  console.error(`[webhook] ${message}`)
  await notifyDiscord(`⚠️ ${message}`).catch(console.error)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    // ── Sponsor payment ──────────────────────────────────────────────────
    if (session.metadata?.type === "sponsor") {
      const { slot, startDate, endDate, name, tagline, websiteUrl, imageUrl, userId, email } =
        session.metadata

      if (!slot || !startDate || !endDate || !name || !tagline || !websiteUrl) {
        return NextResponse.json({ error: "Missing sponsor metadata" }, { status: 400 })
      }

      const slotNumber = Number(slot)
      if (!Number.isInteger(slotNumber) || slotNumber < 1) {
        return NextResponse.json({ error: "Invalid sponsor slot" }, { status: 400 })
      }

      // The slot was checked when the Checkout Session was created, but nothing
      // held it. Two sponsors can reach payment for the same slot and dates.
      // Re-check under an advisory lock so exactly one insert wins.
      const booking = await db.transaction(async (tx) => {
        // Serialises every booking attempt for this slot until commit. Taken
        // before the duplicate check, not after: two concurrent deliveries of
        // the same event would otherwise both find no existing row, and the
        // loser would be reported as a slot conflict instead of a retry.
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`sponsor-slot-${slotNumber}`}))`,
        )

        const already = await tx
          .select({ id: sponsors.id })
          .from(sponsors)
          .where(eq(sponsors.stripeSessionId, session.id))
          .then((r) => r[0])
        if (already) return "duplicate" as const

        const overlapping = await tx
          .select({ id: sponsors.id })
          .from(sponsors)
          .where(
            and(
              eq(sponsors.slot, slotNumber),
              lte(sponsors.startsAt, endDate),
              gte(sponsors.endsAt, startDate),
            ),
          )
          .limit(1)
        if (overlapping.length > 0) return "taken" as const

        await tx.insert(sponsors).values({
          slot: slotNumber,
          name,
          tagline,
          websiteUrl,
          imageUrl: imageUrl || null,
          startsAt: startDate,
          endsAt: endDate,
          totalCents: session.amount_total ?? 0,
          stripeSessionId: session.id,
          userId: userId || null,
          email: email || session.customer_email || "",
        })
        return "booked" as const
      })

      if (booking === "duplicate") {
        return NextResponse.json({ received: true })
      }

      if (booking === "taken") {
        // Someone else won the slot between checkout and payment. Do not
        // double-book, and do not move money automatically either — a human
        // decides whether to refund or offer another slot.
        const alert =
          `⚠️ Sponsor payment with no slot left — slot ${slotNumber}, ` +
          `${startDate}→${endDate}, ${email || session.customer_email || "unknown"}. ` +
          `Needs a manual refund or reschedule: ${session.id}`
        console.error(`[webhook] ${alert}`)
        await notifyDiscord(alert).catch(console.error)
        return NextResponse.json({ received: true, conflict: true })
      }

      revalidatePath("/")
      revalidatePath("/sponsor")

      const sponsorEmail = email || session.customer_email || ""
      sendSponsorConfirmedEmail(
        sponsorEmail,
        name,
        Number(slot),
        startDate,
        endDate,
        session.amount_total ?? 0,
      ).catch(console.error)

      return NextResponse.json({ received: true })
    }

    // ── Free → paid upgrade ──────────────────────────────────────────────
    if (session.metadata?.kind === "upgrade") {
      const submissionId = Number(session.metadata.submissionId)
      const targetTier = session.metadata.tier as "boost" | "highlight"

      if (!submissionId || (targetTier !== "boost" && targetTier !== "highlight")) {
        return NextResponse.json({ error: "Invalid upgrade metadata" }, { status: 400 })
      }

      const submission = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
      })
      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      const submitterEmail = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, submission.userId))
        .then((rows) => rows[0]?.email)

      if (targetTier === "boost") {
        const schedule = await findNextAvailableWeek("boost")
        const launchDate = formatLaunchDate(schedule.week, schedule.year)

        const outcome = await db.transaction(async (tx) => {
          const claim = await claimSession(tx, submissionId, session.id)
          if (claim !== "claimed") return claim

          await tx
            .update(submissions)
            .set({
              tier: "boost",
              status: "accepted",
              scheduledWeek: schedule.week,
              scheduledYear: schedule.year,
            })
            .where(eq(submissions.id, submissionId))

          return "claimed" as const
        })

        if (outcome === "duplicate") return NextResponse.json({ received: true })
        if (outcome === "missing") {
          return NextResponse.json({ error: "Submission not found" }, { status: 404 })
        }
        if (outcome === "conflict") {
          await reportUnfulfilled(
            `Submission ${submissionId} already carries a different Checkout ` +
              `Session — ${session.id} paid but not fulfilled`,
          )
          return NextResponse.json({ received: true, ignored: true })
        }

        if (submitterEmail) {
          sendPaymentConfirmedEmail(
            submitterEmail,
            submission.name,
            "boost",
            launchDate,
          ).catch(console.error)
        }
      } else {
        const result = await claimAndPublishHighlight(
          submission,
          session.id,
          session.payment_intent as string,
        )

        if (result.status !== "published") {
          if (result.status === "duplicate") {
            return NextResponse.json({ received: true })
          }
          if (result.status === "missing") {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 })
          }
          await reportUnfulfilled(
            `Submission ${submissionId} already carries a different Checkout ` +
              `Session — ${session.id} paid but not fulfilled`,
          )
          return NextResponse.json({ received: true, ignored: true })
        }

        if (submitterEmail) {
          sendSubmissionPublishedEmail(
            submitterEmail,
            submission.name,
            result.slug,
            true,
          ).catch(console.error)
        }
      }

      return NextResponse.json({ received: true })
    }

    // ── Submission payment ───────────────────────────────────────────────
    const submissionId = session.metadata?.submissionId
    const tier = session.metadata?.tier

    if (!submissionId || !tier) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    const id = Number(submissionId)

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
    })
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const submitterEmail = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, submission.userId))
      .then((rows) => rows[0]?.email)

    const unfulfilled = `Submission ${id} already carries a different Checkout Session — ${session.id} paid but not fulfilled`

    if (tier === "highlight") {
      const result = await claimAndPublishHighlight(
        submission,
        session.id,
        session.payment_intent as string,
      )

      if (result.status !== "published") {
        if (result.status === "duplicate") {
          return NextResponse.json({ received: true })
        }
        if (result.status === "missing") {
          return NextResponse.json({ error: "Submission not found" }, { status: 404 })
        }
        await reportUnfulfilled(unfulfilled)
        return NextResponse.json({ received: true, ignored: true })
      }

      if (submitterEmail) {
        sendSubmissionPublishedEmail(
          submitterEmail,
          submission.name,
          result.slug,
          true,
        ).catch(console.error)
      }

      return NextResponse.json({ received: true })
    }

    // Boost auto-accepts and auto-schedules; anything else waits for review.
    const schedule =
      tier === "boost" ? await findNextAvailableWeek("boost") : null

    const outcome = await db.transaction(async (tx) => {
      const claim = await claimSession(tx, id, session.id)
      if (claim !== "claimed") return claim

      await tx
        .update(submissions)
        .set(
          schedule
            ? {
                status: "accepted",
                scheduledWeek: schedule.week,
                scheduledYear: schedule.year,
              }
            : { status: "pending" },
        )
        .where(eq(submissions.id, id))

      return "claimed" as const
    })

    if (outcome === "duplicate") return NextResponse.json({ received: true })
    if (outcome === "missing") {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }
    if (outcome === "conflict") {
      await reportUnfulfilled(unfulfilled)
      return NextResponse.json({ received: true, ignored: true })
    }

    if (schedule && submitterEmail) {
      sendPaymentConfirmedEmail(
        submitterEmail,
        submission.name,
        tier,
        formatLaunchDate(schedule.week, schedule.year),
      ).catch(console.error)
    }
  }

  return NextResponse.json({ received: true })
}
