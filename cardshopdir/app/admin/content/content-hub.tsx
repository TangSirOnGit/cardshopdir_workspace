"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  name: string
  slug?: string
  tagline: string | null
  tier: string
  websiteUrl?: string
  thumbnailUrl?: string | null
  voteCount?: number
}

interface ContentHubProps {
  currentProducts: Product[]
  lastBatchProducts: Product[]
  lastBatchWeek: number
  upcomingProducts: Product[]
  siteUrl: string
  siteName: string
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// ── Tweet generation ─────────────────────────────────────────────────────────

interface TweetData {
  label: string
  category: string
  text: string
}

// Category display order: launch day and recap first
const CATEGORY_ORDER = ["launch", "recap", "product", "teaser", "cta"]

const CATEGORY_LABELS: Record<string, string> = {
  launch: "Launch day",
  recap: "Recap",
  product: "Per product",
  teaser: "Teaser",
  cta: "Evergreen",
}

function generateTweets(
  currentProducts: Product[],
  lastBatchProducts: Product[],
  lastBatchWeek: number,
  upcomingProducts: Product[],
  siteUrl: string,
  siteName: string
): TweetData[] {
  const tweets: TweetData[] = []

  // ── Launch day (multiple variants) ──────────────────────────────────
  if (currentProducts.length > 0) {
    const names = currentProducts.slice(0, 5).map((p) => p.name)
    const count = currentProducts.length

    // Variant 1: bullet list
    tweets.push({
      label: "Bullet list",
      category: "launch",
      text: [
        `This week on ${siteName}:`,
        "",
        ...names.map((n) => `- ${n}`),
        count > 5 ? `- and ${count - 5} more` : "",
        "",
        `Check them out ${siteUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    // Variant 2: numbered with taglines
    tweets.push({
      label: "Numbered + taglines",
      category: "launch",
      text: [
        `${count} new products just launched on ${siteName}`,
        "",
        ...currentProducts
          .slice(0, 5)
          .map(
            (p, i) => `${i + 1}. ${p.name}${p.tagline ? ` - ${p.tagline}` : ""}`
          ),
        "",
        siteUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    // Variant 3: hype / excitement
    tweets.push({
      label: "Hype",
      category: "launch",
      text: [
        `New batch is live on ${siteName}!`,
        "",
        `${count} fresh products to discover this week.`,
        "",
        ...names.slice(0, 3).map((n) => `- ${n}`),
        count > 3 ? `- and ${count - 3} more` : "",
        "",
        siteUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    // Variant 4: question hook
    tweets.push({
      label: "Question hook",
      category: "launch",
      text: [
        `Looking for something new to try?`,
        "",
        `${count} products just launched on ${siteName} this week:`,
        "",
        ...names.slice(0, 4).map((n) => `- ${n}`),
        count > 4 ? `+ more` : "",
        "",
        siteUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    })
  }

  // ── Recap (multiple variants) ───────────────────────────────────────
  if (lastBatchProducts.length > 0) {
    const top3 = lastBatchProducts.slice(0, 3)
    const top5 = lastBatchProducts.slice(0, 5)

    // Variant 1: medals
    tweets.push({
      label: "Medals",
      category: "recap",
      text: [
        `Top products from last week on ${siteName}:`,
        "",
        ...top3.map(
          (p, i) =>
            `${["🥇", "🥈", "🥉"][i]} ${p.name}${p.voteCount ? ` (${p.voteCount} votes)` : ""}`
        ),
        "",
        siteUrl,
      ].join("\n"),
    })

    // Variant 2: numbered with batch link
    tweets.push({
      label: "Numbered",
      category: "recap",
      text: [
        `Here's what the community voted for last week:`,
        "",
        ...top3.map(
          (p, i) =>
            `${i + 1}. ${p.name}${p.voteCount ? ` (${p.voteCount} votes)` : ""}`
        ),
        "",
        `See the full batch: ${siteUrl}/batches`,
      ].join("\n"),
    })

    // Variant 3: winner spotlight
    if (top3[0]) {
      tweets.push({
        label: "Winner spotlight",
        category: "recap",
        text: [
          `${top3[0].name} won the week on ${siteName}${top3[0].voteCount ? ` with ${top3[0].voteCount} votes` : ""}.`,
          "",
          top3[0].tagline ? `${top3[0].tagline}` : "",
          "",
          top3[0].slug ? `${siteUrl}/p/${top3[0].slug}` : siteUrl,
        ]
          .filter(Boolean)
          .join("\n"),
      })
    }

    // Variant 4: top 5 extended
    if (top5.length >= 5) {
      tweets.push({
        label: "Top 5",
        category: "recap",
        text: [
          `Week ${lastBatchWeek} results on ${siteName}:`,
          "",
          ...top5.map(
            (p, i) =>
              `${i + 1}. ${p.name}${p.voteCount ? ` - ${p.voteCount} votes` : ""}`
          ),
          "",
          `${siteUrl}/batches`,
        ].join("\n"),
      })
    }

    // Variant 5: conversational
    tweets.push({
      label: "Conversational",
      category: "recap",
      text: [
        `Last week's batch on ${siteName} was great.`,
        "",
        `The community picked ${top3.map((p) => p.name).join(", ")} as the top launches.`,
        "",
        `Full results: ${siteUrl}/batches`,
      ].join("\n"),
    })
  }

  // ── Individual product tweets ───────────────────────────────────────
  for (const p of currentProducts) {
    const url = `${siteUrl}/p/${p.slug}`
    tweets.push({
      label: p.name,
      category: "product",
      text: [
        `${p.name} just launched on ${siteName}`,
        p.tagline ? `\n${p.tagline}` : "",
        `\n${url}`,
      ]
        .filter(Boolean)
        .join(""),
    })
  }

  // ── Teaser for upcoming ─────────────────────────────────────────────
  if (upcomingProducts.length > 0) {
    tweets.push({
      label: "Coming next week",
      category: "teaser",
      text: [
        `${upcomingProducts.length} product${upcomingProducts.length > 1 ? "s" : ""} launching next Monday on ${siteName}`,
        "",
        "Submit yours before it's too late:",
        `${siteUrl}/submit`,
      ].join("\n"),
    })
  }

  // ── Evergreen CTAs ──────────────────────────────────────────────────
  tweets.push({
    label: "Submit CTA",
    category: "cta",
    text: [
      `Launching a product?`,
      "",
      `Get it in front of people who care about good design.`,
      "",
      `${siteUrl}/submit`,
    ].join("\n"),
  })

  tweets.push({
    label: "Dofollow CTA",
    category: "cta",
    text: [
      `Top 3 voted products on ${siteName} get a lifetime dofollow backlink.`,
      "",
      `Free to submit. Launches every Monday.`,
      "",
      `${siteUrl}/submit`,
    ].join("\n"),
  })

  tweets.push({
    label: "Social proof CTA",
    category: "cta",
    text: [
      `${siteName} is a directory of trading card shops across the United States.`,
      "",
      `Boost your launch, earn a dofollow backlink, and reach an engaged audience.`,
      "",
      `${siteUrl}/submit`,
    ].join("\n"),
  })

  return tweets
}

// ── Copy card ────────────────────────────────────────────────────────────────

function CopyCard({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const charCount = text.length

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted">
      <p className="mb-1 text-[11px] font-medium text-muted-foreground/50">
        {label}
      </p>
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{text}</p>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            "text-[11px] tabular-nums",
            charCount > 280 ? "text-red-500" : "text-muted-foreground/30"
          )}
        >
          {charCount}/280
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function ContentHub({
  currentProducts,
  lastBatchProducts,
  lastBatchWeek,
  upcomingProducts,
  siteUrl,
  siteName,
}: ContentHubProps) {
  const tweets = generateTweets(
    currentProducts,
    lastBatchProducts,
    lastBatchWeek,
    upcomingProducts,
    siteUrl,
    siteName
  )

  const categories = CATEGORY_ORDER.filter((cat) =>
    tweets.some((t) => t.category === cat)
  )

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const catTweets = tweets.filter((t) => t.category === cat)
        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <XLogo className="h-3 w-3 text-muted-foreground/40" />
              <h2 className="text-[13px] font-medium">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <span className="text-[11px] text-muted-foreground/30">
                {catTweets.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {catTweets.map((tweet) => (
                <CopyCard
                  key={tweet.label}
                  label={tweet.label}
                  text={tweet.text}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
