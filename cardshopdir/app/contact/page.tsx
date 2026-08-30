import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Contact · ${settings.siteName}`,
    description: `Get in touch with the ${settings.siteName} team. Questions about shops, directory listings, or partnerships.`,
    alternates: { canonical: "/contact" },
  }
}

export default async function ContactPage() {
  const settings = await getSettingsTyped()
  const contactEmail =
    settings.contactEmail ||
    `contact@${new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname}`

  return (
    <div className="mx-auto max-w-2xl space-y-10 pt-2 sm:pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="space-y-3">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Contact
        </h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Have a question, feedback, or want to partner with us? We&rsquo;d love
          to hear from you.
        </p>
      </header>

      <div className="space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Email us</h2>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-4 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            {contactEmail}
          </a>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Common topics</h2>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <strong>Submissions</strong> &mdash; questions about the review
              process, paid tiers, or scheduling.
            </li>
            <li>
              <strong>Sponsorships</strong> &mdash; custom packages, volume
              discounts, or long-term partnerships.
            </li>
            <li>
              <strong>Feedback</strong> &mdash; suggestions, bug reports, or
              feature requests.
            </li>
            <li>
              <strong>Press &amp; partnerships</strong> &mdash; media inquiries
              or collaboration proposals.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Response time</h2>
          <p>
            We typically respond within 24&ndash;48 hours on business days.
          </p>
        </section>
      </div>
    </div>
  )
}
