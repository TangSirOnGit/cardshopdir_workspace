import type { Metadata } from "next"
import { getSettingsTyped } from "@/lib/settings"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Privacy Policy — CardShopDir",
  description:
    "Privacy policy for CardShopDir. Learn how we handle your data and protect your privacy.",
  alternates: { canonical: "/privacy" },
}

export default async function PrivacyPage() {
  const settings = await getSettingsTyped()
  const siteName = settings.siteName

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <h1 className="font-serif text-3xl tracking-tight">Privacy Policy</h1>
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
            Information We Collect
          </h2>
          <p>
            {siteName} is a directory website. When you browse our directory, we
            collect standard server logs (IP address, user agent, pages
            visited). If you create an account, we store your email address and
            display name.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            How We Use Information
          </h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>To provide and improve our directory service</li>
            <li>
              To send transactional emails (account verification, password
              reset)
            </li>
            <li>To analyze traffic and usage patterns</li>
            <li>To prevent abuse and spam</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Cookies
          </h2>
          <p>
            We use essential cookies for authentication and session management.
            We do not use third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Third-Party Services
          </h2>
          <p>
            We use Cloudflare R2 for image storage and may use analytics tools
            that process anonymized traffic data. These services have their own
            privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Your Rights
          </h2>
          <p>
            You can request deletion of your account at any time by contacting
            us at {settings.contactEmail || "the contact page"}.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p>
            Questions about this policy? Reach out via our{" "}
            <a href="/contact" className="underline hover:text-foreground">
              contact page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
