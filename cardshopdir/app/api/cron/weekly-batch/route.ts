import { NextRequest } from "next/server"
import { render } from "@react-email/components"
import { env } from "@/lib/env"
import { verifyCronToken } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import {
  batches,
  products,
  submissions,
  user,
} from "@/lib/db/schema"
import { eq, and, or, desc, isNull, asc } from "drizzle-orm"
import { getISOWeek, getISOWeekYear, subWeeks } from "date-fns"
import { getSettingsTyped } from "@/lib/settings"
import { sendSubmissionPublishedEmail } from "@/lib/emails"
import { plunk } from "@/lib/plunk"
import WeeklyNewsletterEmail from "@/emails/weekly-newsletter"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  // ── Auth: Bearer token must match CRON_SECRET ──────────────────────────────

  const secret = env.CRON_SECRET
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    )
  }

  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token || !verifyCronToken(token, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Run weekly batch logic ─────────────────────────────────────────────────

  const logs: string[] = []
  const log = (msg: string) => {
    logs.push(msg)
    console.log(msg)
  }

  try {
    const settings = await getSettingsTyped()
    const now = new Date()
    const currentWeek = getISOWeek(now)
    const currentYear = getISOWeekYear(now)
    const lastWeek = subWeeks(now, 1)
    const lastWeekNumber = getISOWeek(lastWeek)
    const lastWeekYear = getISOWeekYear(lastWeek)

    // ── 1. Publish accepted submissions into this week's batch ──────────────

    log(
      `Publishing accepted submissions into Week ${currentWeek}, ${currentYear}...`,
    )

    const selectSubmission = {
      id: submissions.id,
      name: submissions.name,
      tagline: submissions.tagline,
      description: submissions.description,
      websiteUrl: submissions.websiteUrl,
      thumbnailUrl: submissions.thumbnailUrl,
      logoUrl: submissions.logoUrl,
      tier: submissions.tier,
      userEmail: user.email,
    }

    // Publish submissions scheduled for this week (or without a schedule for backwards compat)
    const acceptedBoosts = await db
      .select(selectSubmission)
      .from(submissions)
      .leftJoin(user, eq(submissions.userId, user.id))
      .where(
        and(
          eq(submissions.status, "accepted"),
          isNull(submissions.publishedAt),
          eq(submissions.tier, "boost"),
          or(
            and(eq(submissions.scheduledWeek, currentWeek), eq(submissions.scheduledYear, currentYear)),
            isNull(submissions.scheduledWeek),
          ),
        ),
      )
      .orderBy(asc(submissions.createdAt))

    const acceptedFree = await db
      .select(selectSubmission)
      .from(submissions)
      .leftJoin(user, eq(submissions.userId, user.id))
      .where(
        and(
          eq(submissions.status, "accepted"),
          isNull(submissions.publishedAt),
          eq(submissions.tier, "free"),
          or(
            and(eq(submissions.scheduledWeek, currentWeek), eq(submissions.scheduledYear, currentYear)),
            isNull(submissions.scheduledWeek),
          ),
        ),
      )
      .orderBy(asc(submissions.createdAt))
      .limit(settings.freeSlotsPerBatch)

    const toPublish = [...acceptedBoosts, ...acceptedFree]

    // Skip batch creation if nothing to publish — never create an empty batch
    if (toPublish.length === 0) {
      log("No accepted submissions to publish this week. Skipping batch.")
    } else {
      let currentBatch = await db.query.batches.findFirst({
        where: and(
          eq(batches.weekNumber, currentWeek),
          eq(batches.year, currentYear),
        ),
      })

      if (!currentBatch) {
        const [newBatch] = await db
          .insert(batches)
          .values({
            weekNumber: currentWeek,
            year: currentYear,
            publishedAt: now,
          })
          .returning()
        currentBatch = newBatch
        log(`  Created batch #${currentBatch.id}`)
      }

      let position = 0

      for (const sub of toPublish) {
        let slug = sub.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")

        const existing = await db.query.products.findFirst({
          where: eq(products.slug, slug),
        })
        if (existing) slug = `${slug}-${Date.now()}`

        const [newProduct] = await db.insert(products).values({
          batchId: currentBatch.id,
          name: sub.name,
          slug,
          tagline: sub.tagline,
          description: sub.description,
          thumbnailUrl: sub.thumbnailUrl,
          websiteUrl: sub.websiteUrl,
          tier: sub.tier,
          position,
          dofollow: sub.tier === "boost",
          logoUrl: sub.logoUrl,
        }).returning()

        await db
          .update(submissions)
          .set({ publishedAt: now, productId: newProduct.id })
          .where(eq(submissions.id, sub.id))

        if (sub.userEmail) {
          sendSubmissionPublishedEmail(sub.userEmail, sub.name, slug).catch(
            console.error,
          )
        }

        log(
          `  + [${sub.tier.toUpperCase()}] ${sub.name} → position ${position}`,
        )
        position++
      }

      log(
        `Published ${toPublish.length} products (${acceptedBoosts.length} boost, ${acceptedFree.length} free)`,
      )
    }

    // ── 2. Process last week's batch: dofollow ──────────────────────────────

    log(
      `Processing dofollow for last week: Week ${lastWeekNumber}, ${lastWeekYear}`,
    )

    const lastBatch = await db.query.batches.findFirst({
      where: and(
        eq(batches.weekNumber, lastWeekNumber),
        eq(batches.year, lastWeekYear),
      ),
    })

    if (!lastBatch) {
      log("  No batch found for last week. Skipping dofollow.")
    } else {
      const batchProducts = await db.query.products.findMany({
        where: eq(products.batchId, lastBatch.id),
        orderBy: desc(products.voteCount),
      })

      // Reset dofollow for non-highlight products only (highlights keep dofollow permanently)
      const nonHighlights = batchProducts.filter((p) => p.tier !== "highlight")

      for (const p of nonHighlights) {
        if (p.dofollow) {
          await db
            .update(products)
            .set({ dofollow: false })
            .where(eq(products.id, p.id))
        }
      }

      // Top 3 by votes get dofollow
      const top3 = nonHighlights.slice(0, settings.dofollowTopN)
      for (const p of top3) {
        await db
          .update(products)
          .set({ dofollow: true })
          .where(eq(products.id, p.id))
        log(`  Dofollow granted: ${p.name} (${p.voteCount} votes)`)
      }

      // All boosts get dofollow (guaranteed)
      const boosts = nonHighlights.filter(
        (p) => p.tier === "boost" && !top3.includes(p),
      )
      for (const p of boosts) {
        await db
          .update(products)
          .set({ dofollow: true })
          .where(eq(products.id, p.id))
        log(`  Dofollow granted (boost): ${p.name}`)
      }

      log(
        `  Processed ${batchProducts.length} products, top ${settings.dofollowTopN} + ${boosts.length} boosts got dofollow`,
      )
    }

    // ── 3. Send weekly newsletter via Plunk campaign ─────────────────────────
    //
    // Selection rules (matches /pricing promises):
    //   - All Highlight products (guaranteed newsletter mention)
    //   - All Boost products     (guaranteed newsletter mention)
    //   - Top N Free products by votes, where N = settings.dofollowTopN
    //     (same bar as dofollow promotion — "newsletter mention if top N")
    //
    // Within each tier group, sorted by vote_count desc.

    if (lastBatch) {
      const [highlights, boosts, topFrees] = await Promise.all([
        db.query.products.findMany({
          where: and(
            eq(products.batchId, lastBatch.id),
            eq(products.tier, "highlight"),
          ),
          orderBy: desc(products.voteCount),
        }),
        db.query.products.findMany({
          where: and(
            eq(products.batchId, lastBatch.id),
            eq(products.tier, "boost"),
          ),
          orderBy: desc(products.voteCount),
        }),
        db.query.products.findMany({
          where: and(
            eq(products.batchId, lastBatch.id),
            eq(products.tier, "free"),
          ),
          orderBy: desc(products.voteCount),
          limit: settings.dofollowTopN,
        }),
      ])

      const topProducts = [...highlights, ...boosts, ...topFrees]

      if (topProducts.length > 0) {
        const html = await render(
          WeeklyNewsletterEmail({
            weekNumber: lastWeekNumber,
            year: lastWeekYear,
            products: topProducts.map((p) => ({
              name: p.name,
              slug: p.slug,
              tagline: p.tagline,
              tier: p.tier,
              thumbnailUrl: p.thumbnailUrl,
            })),
          }),
        )

        const campaign = await plunk.campaigns.create({
          name: `Week ${lastWeekNumber}, ${lastWeekYear}`,
          subject: `${settings.siteName} — Week ${lastWeekNumber} launches`,
          body: html,
        })

        if (campaign) {
          await plunk.campaigns.send(campaign.id)
          log(`Newsletter campaign sent (campaign ${campaign.id})`)
        }
      } else {
        log("No products in last batch — skipping newsletter.")
      }
    }

    // Revalidate homepage to show new batch
    revalidatePath("/")
    revalidatePath("/batches")

    log("Done.")

    return Response.json({ ok: true, logs })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Weekly batch failed:", err)
    return Response.json(
      { error: message, logs },
      { status: 500 },
    )
  }
}
