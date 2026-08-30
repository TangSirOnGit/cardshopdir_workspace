import { getStripe } from "./stripe"
import { db } from "./db"
import { submissions } from "./db/schema"
import { eq } from "drizzle-orm"

/**
 * Returns the Stripe dashboard URL for the payment so admin can refund manually.
 */
export async function getStripePaymentUrl(submissionId: number) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  })

  if (!submission?.stripeSessionId) {
    return null
  }

  const session = await getStripe().checkout.sessions.retrieve(submission.stripeSessionId)

  if (!session.payment_intent) {
    return null
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id

  return `https://dashboard.stripe.com/payments/${paymentIntentId}`
}
