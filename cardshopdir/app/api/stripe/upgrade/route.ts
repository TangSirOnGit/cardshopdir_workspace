import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getStripe } from "@/lib/stripe"
import { getSettingsTyped } from "@/lib/settings"
import { env } from "@/lib/env"
import { headers } from "next/headers"

/**
 * Upgrade an existing free-tier submission to Boost or Highlight.
 *
 * Works for any free submission owned by the user that is not yet published —
 * i.e., status in (pending, accepted) with publishedAt IS NULL.
 *
 * On successful checkout, the webhook handler reads metadata.kind === "upgrade"
 * and mutates the existing submission in place (no new submission row).
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { submissionId, targetTier } = (await request.json()) as {
    submissionId?: number
    targetTier?: "boost" | "highlight"
  }

  if (!submissionId || (targetTier !== "boost" && targetTier !== "highlight")) {
    return NextResponse.json(
      { error: "submissionId + targetTier (boost|highlight) are required" },
      { status: 400 },
    )
  }

  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.id, submissionId),
      eq(submissions.userId, session.user.id),
    ),
  })

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.tier !== "free") {
    return NextResponse.json(
      { error: "Only free-tier submissions can be upgraded" },
      { status: 400 },
    )
  }

  if (submission.publishedAt) {
    return NextResponse.json(
      { error: "Already published — can't upgrade" },
      { status: 400 },
    )
  }

  if (submission.status === "rejected") {
    return NextResponse.json(
      { error: "Rejected submissions can't be upgraded" },
      { status: 400 },
    )
  }

  const settings = await getSettingsTyped()
  const pricing = {
    boost: { amount: settings.boostPriceCents, label: "Boost" },
    highlight: { amount: settings.highlightPriceCents, label: "Highlight" },
  }[targetTier]

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pricing.amount,
          product_data: {
            name: `${settings.siteName} ${pricing.label} upgrade — ${submission.name}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      kind: "upgrade",
      submissionId: String(submission.id),
      tier: targetTier,
      userId: session.user.id,
    },
    customer_email: session.user.email,
    allow_promotion_codes: true,
    success_url: `${env.BETTER_AUTH_URL}/profile?upgraded=${targetTier}`,
    cancel_url: `${env.BETTER_AUTH_URL}/profile?upgrade_canceled=1`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
