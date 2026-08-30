// Privacy Policy — auto-personalized from site_name + contact_email settings.
// Edit only if you change how data is handled — e.g. adding analytics beyond
// Plausible, self-hosting payment data, or different retention rules. Bump the
// "Last updated" date when you do.

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Privacy Policy · ${settings.siteName}`,
    description: `Learn how ${settings.siteName} collects, stores, and protects your personal data.`,
    alternates: { canonical: "/privacy" },
  }
}

export default async function PrivacyPage() {
  const settings = await getSettingsTyped()
  const contactEmail = settings.contactEmail || `contact@${new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname}`
  return (
    <div className="mx-auto max-w-2xl space-y-8 pt-2 sm:pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>
      <div>
        <h1 className="font-serif text-2xl tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-[12px] text-muted-foreground/50">
          Last updated: March 29, 2026
        </p>
      </div>

      <div className="space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Who we are</h2>
          <p>
            {settings.siteName} is operated by an independent publisher.
            For any privacy-related inquiry, contact us at{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Data we collect</h2>
          <p>We collect only what is necessary to run the service:</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Account data</strong>: when you sign in via GitHub or
              Google, we receive and store your name, email address, and profile
              image.
            </li>
            <li>
              <strong>Submissions</strong>: product name, tagline, website URL,
              and uploaded thumbnail.
            </li>
            <li>
              <strong>Newsletter</strong>: your email address if you subscribe
              to the weekly digest.
            </li>
            <li>
              <strong>Votes</strong>: which products you vote for, along with
              your IP address for rate-limiting.
            </li>
            <li>
              <strong>Session data</strong>: IP address and user agent for
              authentication security.
            </li>
            <li>
              <strong>Payment data</strong>: paid submissions are processed by
              Stripe. We do not store card details. We only retain the Stripe
              session ID to link payments to submissions.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">How we use your data</h2>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>Display your submitted products on the site</li>
            <li>
              Send transactional emails (submission status, payment
              confirmation)
            </li>
            <li>Send the weekly newsletter if you subscribed</li>
            <li>Prevent abuse (rate limiting, duplicate detection)</li>
          </ul>
          <p>We do not use your data for advertising or profiling.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Analytics</h2>
          <p>
            We use{" "}
            <a
              href="https://plausible.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Plausible Analytics
            </a>
            , a privacy-focused analytics tool. Plausible does not use cookies,
            does not collect personal data, and is fully compliant with GDPR. No
            consent banner is required.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Third-party services</h2>
          <p>Your data may be processed by the following services:</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Stripe</strong>: payment processing (
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                privacy policy
              </a>
              )
            </li>
            <li>
              <strong>Plunk</strong>: transactional and newsletter emails
            </li>
            <li>
              <strong>Cloudflare</strong>: image hosting (R2) and CDN
            </li>
            <li>
              <strong>GitHub / Google</strong>: OAuth authentication
            </li>
            <li>
              <strong>Plausible</strong>: privacy-friendly analytics (no
              cookies, no personal data)
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Cookies</h2>
          <p>
            {settings.siteName} uses only essential cookies required for authentication
            (session token). We do not use tracking cookies, advertising
            cookies, or any third-party cookies. Plausible Analytics does not
            set any cookies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Data retention</h2>
          <p>
            Account data is kept for as long as your account exists. Submission
            data is kept for as long as the product is listed. Newsletter
            subscriptions are kept until you unsubscribe. You can request
            deletion at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Your rights (GDPR)</h2>
          <p>
            As a user in the European Union, you have the right to access,
            rectify, delete, or export your personal data. You can also withdraw
            consent or object to processing at any time.
          </p>
          <p>
            To exercise any of these rights, email{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Changes</h2>
          <p>
            We may update this policy from time to time. Significant changes
            will be communicated via email or a notice on the site.
          </p>
        </section>
      </div>
    </div>
  )
}
