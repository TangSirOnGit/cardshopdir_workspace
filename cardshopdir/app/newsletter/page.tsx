import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"
import { NewsletterForm } from "./newsletter-form"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `Newsletter · ${settings.siteName}`,
    description: `Subscribe to the ${settings.siteName} weekly newsletter. Get the best new product launches delivered to your inbox every week.`,
    alternates: { canonical: "/newsletter" },
  }
}

export default async function NewsletterPage() {

  return (
    <div className="mx-auto max-w-xl space-y-10 pt-2 sm:pt-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="text-center">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Stay in the loop
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Get the best new product launches delivered to your inbox every week.
          No spam, unsubscribe anytime.
        </p>
      </header>

      <NewsletterForm />

      <div className="space-y-4 text-center text-[13px] text-muted-foreground">
        <p>
          Every week you&rsquo;ll get a curated digest of the top launches,
          community picks, and new tools worth trying.
        </p>
        <div className="flex items-center justify-center gap-6 text-[12px]">
          <span>Weekly digest</span>
          <span className="text-border">&middot;</span>
          <span>No spam</span>
          <span className="text-border">&middot;</span>
          <span>Unsubscribe anytime</span>
        </div>
      </div>
    </div>
  )
}
