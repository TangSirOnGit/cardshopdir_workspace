import { render } from "@react-email/components"
import { plunk } from "./plunk"
import { getSetting } from "@/lib/settings"

async function siteName() {
  return getSetting("site_name")
}
import WelcomeEmail from "@/emails/welcome"
import VerifyEmailTemplate from "@/emails/verify-email"
import ResetPasswordTemplate from "@/emails/reset-password"

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
      `\n[Email] Plunk not configured — verification link for ${email}:\n  ${url}\n`
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
      `\n[Email] Plunk not configured — password reset link for ${email}:\n  ${url}\n`
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
