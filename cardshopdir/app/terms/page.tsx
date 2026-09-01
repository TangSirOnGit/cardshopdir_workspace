import type { Metadata } from "next"
import { getSettingsTyped } from "@/lib/settings"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Terms of Service — CardShopDir",
  description:
    "Terms of service for CardShopDir. Read the terms and conditions for using our trading card shop directory.",
  alternates: { canonical: "/terms" },
}

export default async function TermsPage() {
  const settings = await getSettingsTyped()
  const siteName = settings.siteName

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <h1 className="font-serif text-3xl tracking-tight">Terms of Service</h1>
      <p className="text-[13px] text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="space-y-6 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Acceptance of Terms
          </h2>
          <p>
            By accessing {siteName}, you agree to these terms. If you do not
            agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Directory Content
          </h2>
          <p>
            {siteName} aggregates publicly available information about trading
            card shops. We strive for accuracy but cannot guarantee that all
            information (hours, contact details, etc.) is current. Always verify
            with the shop before visiting.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            User Accounts
          </h2>
          <p>
            You are responsible for maintaining the security of your account. Do
            not share your credentials with others.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Acceptable Use
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Do not scrape or bulk-download our data</li>
            <li>Do not impersonate shop owners or make false claims</li>
            <li>Do not use the service for any illegal purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Limitation of Liability
          </h2>
          <p>
            {siteName} is provided &ldquo;as is&rdquo; without warranties. We
            are not liable for damages arising from the use of our service or
            the accuracy of shop information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Changes to Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the
            service constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  )
}
