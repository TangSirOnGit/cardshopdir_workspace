import { render } from "@react-email/components"
import { plunk } from "./plunk"
import { getSetting } from "@/lib/settings"

async function siteName() {
  return getSetting("site_name")
}
import WelcomeEmail from "@/emails/welcome"
import SubmissionReceivedEmail from "@/emails/submission-received"
import SubmissionAcceptedEmail from "@/emails/submission-accepted"
import SubmissionRejectedEmail from "@/emails/submission-rejected"
import PaymentConfirmedEmail from "@/emails/payment-confirmed"
import SubmissionRevisionEmail from "@/emails/submission-revision"
import SubmissionPublishedEmail from "@/emails/submission-published"
import VerifyEmailTemplate from "@/emails/verify-email"
import ResetPasswordTemplate from "@/emails/reset-password"
import SponsorConfirmedEmail from "@/emails/sponsor-confirmed"

// ── Email verification ────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, url: string) {
  const html = await render(VerifyEmailTemplate({ url }))

  const result = await plunk.emails.send({
    to: email,
    subject: `Verify your email — ${await siteName()}`,
    body: html,
  })

  // Plunk not configured? Fall back to logging the link to the dev console so
  // the developer can still complete signup without wiring up email first.
  if (!result) {
    console.log(
      `\n[Email] Plunk not configured — verification link for ${email}:\n  ${url}\n`,
    )
  }
}

// ── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, url: string) {
  const html = await render(ResetPasswordTemplate({ url }))

  const result = await plunk.emails.send({
    to: email,
    subject: `Reset your password — ${await siteName()}`,
    body: html,
  })

  if (!result) {
    console.log(
      `\n[Email] Plunk not configured — password reset link for ${email}:\n  ${url}\n`,
    )
  }
}

// ── Welcome subscriber ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string) {
  const html = await render(WelcomeEmail())

  await plunk.emails.send({
    to: email,
    subject: `Welcome to ${await siteName()}!`,
    body: html,
  })
}

// ── Submission received ───────────────────────────────────────────────────────

export async function sendSubmissionReceivedEmail(
  email: string,
  productName: string,
  tier: string
) {
  const tierLabel =
    tier === "free" ? "Free" : tier === "boost" ? "Boost" : "Highlight"
  const html = await render(
    SubmissionReceivedEmail({
      productName,
      tierLabel,
      isHighlight: tier === "highlight",
    })
  )

  await plunk.emails.send({
    to: email,
    subject: `Submission received: ${productName}`,
    body: html,
  })
}

// ── Submission accepted (queued, not yet live) ───────────────────────────────

export async function sendSubmissionAcceptedEmail(
  email: string,
  productName: string,
  tier: "free" | "boost" | "highlight",
  launchInfo: string,
  upgradeUrl?: string
) {
  const html = await render(
    SubmissionAcceptedEmail({ productName, tier, launchInfo, upgradeUrl })
  )

  await plunk.emails.send({
    to: email,
    subject: `${productName} has been accepted on ${await siteName()}!`,
    body: html,
  })
}

// ── Submission published (now live) ──────────────────────────────────────────

export async function sendSubmissionPublishedEmail(
  email: string,
  productName: string,
  slug: string,
  isHighlight = false,
) {
  const html = await render(SubmissionPublishedEmail({ productName, slug, isHighlight }))

  await plunk.emails.send({
    to: email,
    subject: `${productName} is now live on ${await siteName()}!`,
    body: html,
  })
}

// ── Submission rejected ───────────────────────────────────────────────────────

export async function sendSubmissionRejectedEmail(
  email: string,
  productName: string,
  tier: string
) {
  const html = await render(
    SubmissionRejectedEmail({ productName, isPaid: tier !== "free" })
  )

  await plunk.emails.send({
    to: email,
    subject: `Update on your submission: ${productName}`,
    body: html,
  })
}

// ── Submission revision (image needs update) ─────────────────────────────────

export async function sendSubmissionRevisionEmail(
  email: string,
  productName: string,
  deadline: string,
  reasons: string[] = [],
  profileUrl?: string
) {
  const html = await render(
    SubmissionRevisionEmail({ productName, deadline, reasons, profileUrl })
  )

  await plunk.emails.send({
    to: email,
    subject: `Revision requested: ${productName}`,
    body: html,
  })
}

// ── Payment confirmed ─────────────────────────────────────────────────────────

export async function sendPaymentConfirmedEmail(
  email: string,
  productName: string,
  tier: string,
  launchDate?: string,
) {
  const tierLabel = tier === "boost" ? "Boost ($9)" : "Highlight ($29)"
  const html = await render(
    PaymentConfirmedEmail({
      productName,
      tierLabel,
      isHighlight: tier === "highlight",
      launchDate,
    })
  )

  await plunk.emails.send({
    to: email,
    subject: `Payment confirmed for ${productName}`,
    body: html,
  })
}

// ── Sponsor confirmed ───────────────────────────────────────────────────────

export async function sendSponsorConfirmedEmail(
  email: string,
  name: string,
  slot: number,
  startDate: string,
  endDate: string,
  totalCents: number,
) {
  const totalFormatted = `$${(totalCents / 100).toFixed(2)}`
  const html = await render(
    SponsorConfirmedEmail({ name, slot, startDate, endDate, totalFormatted })
  )

  await plunk.emails.send({
    to: email,
    subject: `Sponsor booking confirmed: ${name}`,
    body: html,
  })
}


