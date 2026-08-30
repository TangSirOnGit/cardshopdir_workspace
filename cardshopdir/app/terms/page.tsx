// Terms of Use — auto-personalized from site_name + contact_email settings.
// You only need to edit this if your site differs from the template's default
// (launch directory, free + paid tiers, sponsor slots). Bump the "Last updated"
// date whenever you do change something.

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Terms of Use · ${settings.siteName}`,
    description: `Terms of use for ${settings.siteName}, a directory of trading card shops.`,
    alternates: { canonical: "/terms" },
  }
}

export default async function TermsPage() {
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
        <h1 className="font-serif text-2xl tracking-tight">Terms of Use</h1>
        <p className="mt-1 text-[12px] text-muted-foreground/50">
          Last updated: March 29, 2026
        </p>
      </div>

      <div className="space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-medium text-foreground">About the service</h2>
          <p>
            {settings.siteName} is a curated weekly directory of product
            launches. Products are submitted by users, reviewed by our team, and
            published in weekly batches.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Account</h2>
          <p>
            You must sign in with a GitHub or Google account to submit a product
            or vote. You are responsible for the activity on your account. We may
            suspend or ban accounts that violate these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Submissions</h2>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              All submissions are reviewed before publication. We reserve the
              right to reject or remove any product at our sole discretion,
              without obligation to justify.
            </li>
            <li>
              You must only submit products you are authorized to represent. Do
              not submit illegal, misleading, or harmful content.
            </li>
            <li>
              You retain full ownership of your content. By submitting, you grant
              {settings.siteName} a non-exclusive, worldwide license to display your product
              name, tagline, and thumbnail on the site and in newsletters.
            </li>
            <li>
              Thumbnails must not contain misleading content, explicit material,
              or copyrighted assets you do not own.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Paid tiers</h2>
          <p>{settings.siteName} offers paid submission tiers (Boost and Highlight):</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Boost ($9)</strong>: guarantees placement in the next
              weekly batch with priority positioning and a permanent dofollow
              backlink.
            </li>
            <li>
              <strong>Highlight ($29)</strong>: instant publication, pinned to
              the homepage for 7 days, with a permanent dofollow backlink and a
              guaranteed newsletter mention.
            </li>
          </ul>
          <p>
            Payments are processed securely by Stripe. All prices are in USD and
            inclusive of applicable taxes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Refunds</h2>
          <p>
            If we reject a paid submission, a full refund will be issued to your
            original payment method. Refunds are processed within 5 to 10
            business days.
          </p>
          <p>
            No refunds are issued for published products. If you have concerns
            about a paid submission, contact us at{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>{" "}
            before publication.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Votes</h2>
          <p>
            Voting is limited to authenticated users. Vote manipulation
            (multiple accounts, bots, paid votes) is prohibited and will result
            in removal of the product and a ban.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Dofollow backlinks</h2>
          <p>
            Free submissions may earn a dofollow backlink if they rank in the top
            3 of their weekly batch by votes. Boost and Highlight tiers receive a
            guaranteed dofollow backlink. We reserve the right to revoke dofollow
            status if the linked website becomes harmful or irrelevant.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Prohibited use</h2>
          <p>You agree not to:</p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>Submit spam, malware, or phishing content</li>
            <li>Manipulate votes or game the ranking system</li>
            <li>Scrape or crawl the site beyond normal use</li>
            <li>Attempt to access admin or other user accounts</li>
            <li>Use the service for any illegal purpose</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Limitation of liability</h2>
          <p>
            {settings.siteName} is provided &quot;as is&quot; without warranties of any kind.
            We are not liable for any loss, damage, or disruption caused by the
            use of the service. We do not guarantee uptime, availability, or
            search engine results from backlinks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Governing law</h2>
          <p>
            These terms are governed by French law. Any dispute shall be subject
            to the exclusive jurisdiction of the courts of Paris, France.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Changes</h2>
          <p>
            We may update these terms at any time. Continued use of the service
            after changes constitutes acceptance. Significant changes will be
            communicated via email or a notice on the site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Contact</h2>
          <p>
            For any question regarding these terms, email{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
