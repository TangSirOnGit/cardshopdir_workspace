import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsTyped()
  return {
    title: `FAQ · ${settings.siteName}`,
    description: `Frequently asked questions about ${settings.siteName}: submissions, pricing, voting, backlinks, and more.`,
    alternates: { canonical: "/faq" },
  }
}

const FAQS = [
  {
    q: "How do I submit a product?",
    a: 'Create an account, then head to the <a href="/submit" class="underline">submit page</a>. Fill in your product details, upload a thumbnail, and choose your tier.',
  },
  {
    q: "Is it free to submit?",
    a: "Yes. The free tier places your product in the next available batch. Paid tiers (Boost and Highlight) offer faster placement and extra visibility.",
  },
  {
    q: "What is the difference between Boost and Highlight?",
    a: "<strong>Boost ($9)</strong> guarantees placement in the next weekly batch with a permanent dofollow backlink. <strong>Highlight ($29)</strong> gives you instant publication, a pinned spot on the homepage for 7 days, and a guaranteed newsletter mention.",
  },
  {
    q: "How does the review process work?",
    a: "Every submission is reviewed by our team before publication. We check for quality, relevance, and compliance with our terms. You'll receive an email once your submission is reviewed.",
  },
  {
    q: "When are batches published?",
    a: "New batches are published weekly. The exact schedule depends on the site settings, but you'll always be notified when your product goes live.",
  },
  {
    q: "How does voting work?",
    a: "Authenticated users can vote for products once per product. Votes determine the ranking within a batch. The top products earn additional visibility and dofollow backlinks.",
  },
  {
    q: "What is a dofollow backlink?",
    a: "A dofollow backlink tells search engines to follow the link to your website, passing SEO value. The top products in each batch and all paid tiers receive a permanent dofollow link.",
  },
  {
    q: "Can I edit my submission after submitting?",
    a: "If our team requests a revision (e.g., a better thumbnail), you'll receive an email with instructions to update your submission.",
  },
  {
    q: "What is your refund policy?",
    a: 'If we reject a paid submission, a full refund is issued automatically. No refunds are given for published products. See our <a href="/terms" class="underline">terms</a> for details.',
  },
  {
    q: "How can I sponsor the site?",
    a: 'Visit the <a href="/sponsor" class="underline">sponsor page</a> to book a slot. Your brand will appear in the sidebar of every page for the duration you select.',
  },
]

export default async function FaqPage() {
  const settings = await getSettingsTyped()

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a.replace(/<[^>]*>/g, ""),
      },
    })),
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 pt-2 sm:pt-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Everything you need to know about {settings.siteName}.
        </p>
      </header>

      <div className="divide-y divide-border">
        {FAQS.map((faq, i) => (
          <details key={i} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between text-[14px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div
              className="mt-2 text-[14px] leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: faq.a }}
            />
          </details>
        ))}
      </div>
    </div>
  )
}
