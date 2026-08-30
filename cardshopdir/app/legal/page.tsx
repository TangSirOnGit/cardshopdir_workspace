// Legal Notice — French "mentions légales" (LCEN 2004-575). Keep as-is if you
// operate in France (update publisher/SIRET if applicable). Outside France:
// rewrite for your jurisdiction OR delete this page and remove the /legal link
// from components/footer.tsx.

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Legal Notice · ${settings.siteName}`,
    description: `Legal notice and publisher information for ${settings.siteName}.`,
    alternates: { canonical: "/legal" },
  }
}

export default async function LegalPage() {
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
        <h1 className="font-serif text-2xl tracking-tight">Legal Notice</h1>
        <p className="mt-1 text-[12px] text-muted-foreground/50">
          In accordance with French law n&deg;2004-575 of June 21, 2004
        </p>
      </div>

      <div className="space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Publisher</h2>
          <p>
            {settings.siteName} is published by an independent publisher.
          </p>
          <p>
            Email:{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">Hosting</h2>
          <p>
            This site is hosted on a private server located in Europe.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">
            Intellectual property
          </h2>
          <p>
            The content, design, and code of this site are the property of
            the publisher unless otherwise stated. Product names,
            thumbnails, and taglines displayed on the site belong to their
            respective owners.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">
            Personal data
          </h2>
          <p>
            For information about how we collect and process personal data, see
            our{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </p>
          <p>
            In accordance with the GDPR and French Data Protection Act, you may
            exercise your rights by emailing{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium text-foreground">
            Analytics
          </h2>
          <p>
            This site uses Plausible Analytics, a privacy-focused and
            cookie-free analytics tool that does not collect personal data and is
            fully GDPR-compliant. No consent is required.
          </p>
        </section>
      </div>
    </div>
  )
}
