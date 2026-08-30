import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getStripe } from "@/lib/stripe"
import { getSettingsTyped } from "@/lib/settings"
import { env } from "@/lib/env"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { submissionId } = await request.json()

  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 })
  }

  // Verify the submission belongs to the user and is in draft status
  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.id, submissionId),
      eq(submissions.userId, session.user.id),
      eq(submissions.status, "draft"),
    ),
  })

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.tier === "free") {
    return NextResponse.json({ error: "Free tier does not require payment" }, { status: 400 })
  }

  const settings = await getSettingsTyped()
  const tierPricing = {
    boost: { amount: settings.boostPriceCents, label: "Boost" },
    highlight: { amount: settings.highlightPriceCents, label: "Highlight" },
  }

  const pricing = tierPricing[submission.tier as "boost" | "highlight"]

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pricing.amount,
          product_data: {
            name: `${settings.siteName} ${pricing.label} — ${submission.name}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      submissionId: String(submission.id),
      tier: submission.tier,
      userId: session.user.id,
    },
    customer_email: session.user.email,
    allow_promotion_codes: true,
    success_url: `${env.BETTER_AUTH_URL}/submit?success=true&tier=${submission.tier}`,
    cancel_url: `${env.BETTER_AUTH_URL}/submit?canceled=true`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
