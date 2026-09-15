import type { Metadata } from "next"
import Link from "next/link"
import { MapPin, Gamepad2, ArrowRight } from "lucide-react"
import { db } from "@/lib/db"
import { shops, games, shopGames } from "@/lib/db/schema"
import { eq, desc, sql, count } from "drizzle-orm"
import { SearchBox } from "@/components/search-box"
import {
  getPopularCities,
  getStatesWithCounts,
  getGamesWithCounts,
  stateName,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { SITE_URL } from "@/config"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Card Shops Near Me — Find Trading Card Stores in Your Area | CardShopDir",
  description:
    "Looking for card stores near you? CardShopDir lists 7,700+ local trading card shops across all 50 US states. Find Pokémon, MTG, Yu-Gi-Oh!, sports card, and TCG stores near you with hours, ratings, and directions.",
  alternates: { canonical: "/near-me" },
  openGraph: {
    title: "Card Shops Near Me — Find Trading Card Stores in Your Area",
    description:
      "Browse 7,700+ trading card shops across all 50 US states. Find local card stores near you for Pokémon, MTG, Yu-Gi-Oh!, and sports cards.",
    url: `${SITE_URL}/near-me`,
    type: "website",
  },
}

export default async function NearMePage() {
  const [
    totalShops,
    totalStates,
    totalCities,
    topGames,
    popularStates,
    popularCities,
  ] = await Promise.all([
    db.select({ count: count() }).from(shops).then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(distinct ${shops.state})::int` })
      .from(shops)
      .where(sql`${shops.state} is not null`)
      .then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(distinct ${shops.city})::int` })
      .from(shops)
      .where(sql`${shops.city} is not null and ${shops.city} != ''`)
      .then((r) => r[0].count),
    db
      .select({
        slug: games.slug,
        displayName: games.displayName,
        shopCount: sql<number>`count(${shopGames.shopId})::int`,
      })
      .from(games)
      .leftJoin(shopGames, eq(games.id, shopGames.gameId))
      .groupBy(games.id, games.slug, games.displayName)
      .orderBy(desc(sql`count(${shopGames.shopId})`))
      .limit(8),
    getStatesWithCounts(),
    getPopularCities(8),
  ])

  const baseUrl = SITE_URL
  const pageUrl = `${baseUrl}/near-me`

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I find card shops near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use the search bar above to look up shops by city, state, zip code, or store name. You can also browse our directory of ${totalShops.toLocaleString()} card shops across ${totalStates} states by selecting your state below.`,
        },
      },
      {
        "@type": "Question",
        name: "What types of card stores are near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `CardShopDir lists local stores for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards (baseball, basketball, football), Flesh & Blood, Lorcana, One Piece, and more. Browse by game category to find shops that carry what you collect.`,
        },
      },
      {
        "@type": "Question",
        name: "Are there Pokémon card shops near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes — Pokémon is one of the most widely stocked TCGs in our directory. Use the search bar with your city or zip, or browse the Pokémon category to find local stores selling sealed product, singles, and grading services.`,
        },
      },
      {
        "@type": "Question",
        name: "How many card shops are in the United States?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `CardShopDir currently lists ${totalShops.toLocaleString()} trading card shops across ${totalStates} states and ${totalCities.toLocaleString()} cities, with new stores added regularly.`,
        },
      },
    ],
  }

  const jsonLd = [
    collectionPageJsonLd({
      name: "Card Shops Near Me",
      description: `Directory of ${totalShops.toLocaleString()} trading card shops across the United States. Find local card stores near you.`,
      url: pageUrl,
      numberOfItems: totalShops,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Card Shops Near Me", url: pageUrl },
    ]),
    faqJsonLd,
  ]

  return (
    <div className="space-y-10 pt-4 sm:pt-6">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Card Shops Near Me</span>
      </nav>

      {/* Hero */}
      <header className="space-y-4 text-center">
        <p className="text-[12px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Local Card Shop Directory
        </p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl">
          Card Shops Near Me
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Find local trading card stores in your area. CardShopDir lists{" "}
          {totalShops.toLocaleString()} card shops across {totalStates} states
          and {totalCities.toLocaleString()} cities — including Pokémon, Magic:
          The Gathering, Yu-Gi-Oh!, sports cards, and more. Search by city,
          state, or zip to find card stores near you with hours, ratings, and
          directions.
        </p>

        <SearchBox className="mx-auto mt-5 max-w-md" />

        {/* Popular city quick links */}
        {popularCities.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Popular cities:</span>
            {popularCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/directory/${c.state!.toLowerCase()}/${c.city!.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full border border-border/50 bg-muted/30 px-3 py-1 font-medium transition-colors hover:bg-muted/60"
              >
                {c.city}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Card Shops" value={totalShops.toLocaleString()} />
        <Stat label="States" value={totalStates} />
        <Stat label="Cities" value={totalCities.toLocaleString()} />
        <Stat label="TCG Games" value={topGames.length} />
      </div>

      {/* Browse by State */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            Find Card Shops by State
          </h2>
          <Link
            href="/directory"
            className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            All states
            <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {popularStates.slice(0, 24).map((s) => (
            <Link
              key={s.state}
              href={`/directory/${s.state?.toLowerCase()}`}
              className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
            >
              <span className="font-medium">{stateName(s.state || "")}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {s.shopCount}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Game */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Gamepad2 className="h-5 w-5 text-muted-foreground" />
            Find Card Shops by Game
          </h2>
          <Link
            href="/directory/games"
            className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            All games
            <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {topGames.map((g) => (
            <Link
              key={g.slug}
              href={`/directory/games/${g.slug}`}
              className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
            >
              <span className="font-medium">{g.displayName}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {g.shopCount}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SEO content */}
      <section className="prose prose-sm max-w-none">
        <h2 className="text-lg font-semibold">
          How to Find Local Card Shops Near You
        </h2>
        <div className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
          <p>
            Whether you're hunting for the latest Pokémon set, building a
            Magic: The Gathering Commander deck, or chasing vintage sports
            cards, CardShopDir makes it easy to find local card stores near
            you. Our directory covers {totalShops.toLocaleString()} shops
            across all 50 US states, from major metro hubs to small-town
            hidden gems.
          </p>
          <p>
            <strong>Search by location.</strong> Use the search bar above with
            your city name, state, or zip code to find card shops in your area.
            Each listing includes store hours, ratings, directions, and the
            games they carry, so you know what to expect before you go.
          </p>
          <p>
            <strong>Browse by game.</strong> Collect a specific TCG? Use the
            game categories above to find stores that stock Pokémon, Yu-Gi-Oh!,
            Magic: The Gathering, sports cards, Flesh & Blood, Lorcana, and
            more. Each game page lists every shop nationwide that carries that
            product line.
          </p>
          <p>
            <strong>Browse by state.</strong> Prefer to explore? Start with
            your state above to see all listed card shops, then drill down to
            your city. State pages include shop counts, top cities, and the
            most popular games among local collectors.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          <FaqItem
            question="How do I find card shops near me?"
            answer={`Use the search bar above to look up shops by city, state, zip code, or store name. You can also browse our directory of ${totalShops.toLocaleString()} card shops across ${totalStates} states by selecting your state above.`}
          />
          <FaqItem
            question="What types of card stores are near me?"
            answer="CardShopDir lists local stores for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards (baseball, basketball, football), Flesh & Blood, Lorcana, One Piece, and more. Browse by game category to find shops that carry what you collect."
          />
          <FaqItem
            question="Are there Pokémon card shops near me?"
            answer="Yes — Pokémon is one of the most widely stocked TCGs in our directory. Use the search bar with your city or zip, or browse the Pokémon category to find local stores selling sealed product, singles, and grading services."
          />
          <FaqItem
            question="How many card shops are in the United States?"
            answer={`CardShopDir currently lists ${totalShops.toLocaleString()} trading card shops across ${totalStates} states and ${totalCities.toLocaleString()} cities, with new stores added regularly.`}
          />
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-lg border border-border/50 bg-muted/30">
      <summary className="cursor-pointer list-none px-4 py-3 text-[14px] font-medium transition-colors hover:bg-muted/50">
        <span className="inline-block">
          <span className="mr-2 inline-block text-muted-foreground transition-transform group-open:rotate-90">
            ›
          </span>
          {question}
        </span>
      </summary>
      <p className="px-4 pb-3 text-[13px] leading-relaxed text-muted-foreground">
        {answer}
      </p>
    </details>
  )
}
