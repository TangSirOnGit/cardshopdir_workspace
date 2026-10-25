import type { Metadata } from "next"
import Link from "next/link"
import { SectionTitle } from "@/components/section-title"
import { notFound } from "next/navigation"
import {
  getShopsForGame,
  getGamesWithCounts,
  gameDisplayName,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"
import { SearchBox } from "@/components/search-box"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ game: string }>
}

const GAME_METADATA: Record<string, { title: string; description: string }> = {
  lorcana: {
    title: "Disney Lorcana Card Shops Near Me | CardShopDir",
    description:
      "Find Disney Lorcana card shops near me for booster packs, singles, local events, and trading card stores across the US.",
  },
  "yu-gi-oh": {
    title: "Yu-Gi-Oh! Card Shops Near Me | Find Local Stores | CardShopDir",
    description:
      "Find Yu-Gi-Oh! card shops near me for singles, sealed products, tournaments, and local trading card stores across the US.",
  },
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { game } = await params
  const games = await getGamesWithCounts()
  const displayName = gameDisplayName(game, games)
  const seoName = game === "pokemon" ? "Pokemon" : displayName
  const override = GAME_METADATA[game]
  return {
    title:
      override?.title ??
      `${seoName} Card Shops Near Me & Across the US — CardShopDir`,
    description:
      override?.description ??
      `Find ${seoName} card shops near me and across the US. Browse local stores with ${displayName} products, hours, ratings, directions, and nearby locations.`,
    alternates: { canonical: `/directory/games/${game}` },
  }
}

export async function generateStaticParams() {
  const games = await getGamesWithCounts()
  return games.map((g) => ({ game: g.slug }))
}

// Display name variants for SEO copy (lowercase for inline use)
const GAME_LOWER: Record<string, string> = {
  pokemon: "Pokémon",
  "magic-the-gathering": "Magic: The Gathering",
  "yu-gi-oh": "Yu-Gi-Oh!",
  sports: "sports cards",
  lorcana: "Lorcana",
  "flesh-and-blood": "Flesh & Blood",
  "one-piece": "One Piece",
  "dragon-ball-super": "Dragon Ball Super",
  "star-wars-unlimited": "Star Wars Unlimited",
  digimon: "Digimon",
  "final-fantasy": "Final Fantasy",
  "weiss-schwarz": "Weiss Schwarz",
  "cardfight-vanguard": "Cardfight!! Vanguard",
  "union-arena": "Union Arena",
  riftbound: "Riftbound",
}

const GAME_INTRO: Record<string, string> = {
  pokemon:
    "Find Pokemon card shops near me for booster packs, singles, sealed products, trading, and local events.",
  "union-arena":
    "Find Union Arena card shops near me for boosters, singles, tournament play, and local trading card events.",
  "yu-gi-oh":
    "Find Yu-Gi-Oh! card shops near me for singles, sealed products, tournaments, and local trading card events.",
  riftbound:
    "Find Riftbound card shops near me for packs, singles, league play, and local game stores carrying the new trading card game.",
}

export default async function GameDirectoryPage({ params }: PageProps) {
  const { game } = await params
  const games = await getGamesWithCounts()
  const displayName = gameDisplayName(game, games)

  if (!games.find((g) => g.slug === game)) {
    notFound()
  }

  const shopsList = await getShopsForGame(game, 60)
  const gameLower = GAME_LOWER[game] ?? displayName.toLowerCase()

  // Derive top states for this game from the shop list
  const stateCounts = new Map<string, number>()
  for (const s of shopsList) {
    if (s.state) stateCounts.set(s.state, (stateCounts.get(s.state) ?? 0) + 1)
  }
  const topStates = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/directory/games/${game}`

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Are there ${displayName} card shops near me?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. CardShopDir lists ${shopsList.length} shops across the US that carry ${displayName}. Use the search bar above with your city or zip code, or browse by state below to find local ${gameLower} stores near you.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I find ${displayName} shops near me?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Search by city, state, or zip code using the search bar above, then filter for ${displayName}. Each shop listing includes store hours, ratings, directions, and the full range of games they carry.`,
        },
      },
      {
        "@type": "Question",
        name: `Which states have the most ${displayName} card shops?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            topStates.length > 0
              ? `The states with the most ${displayName} shops in our directory are ${topStates
                  .slice(0, 3)
                  .map(([st, n]) => `${st} (${n})`)
                  .join(", ")}. Browse by state above to see all listed shops.`
              : `${displayName} shops are spread across the US. Browse by state above to find shops in your area.`,
        },
      },
    ],
  }

  const jsonLd = [
    collectionPageJsonLd({
      name: `${displayName} Card Shops Near Me`,
      description: `Directory of ${shopsList.length} shops that carry ${displayName} across the US.`,
      url: pageUrl,
      numberOfItems: shopsList.length,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Directory", url: `${baseUrl}/directory` },
      { name: "Games", url: `${baseUrl}/directory/games` },
      { name: displayName, url: pageUrl },
    ]),
    faqJsonLd,
  ]

  return (
    <div className="space-y-14">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <div className="bleed band-paper -mt-1 space-y-8 border-b-2 border-ink pt-8 pb-10 sm:pb-14">
        <nav className="label-mono flex flex-wrap items-center gap-2 tracking-[0.08em] normal-case [--muted-foreground:var(--ink-muted)] [--primary:var(--vermilion)]">
          <Link
            href="/"
            className="link-draw transition-colors hover:text-primary"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/directory"
            className="link-draw transition-colors hover:text-primary"
          >
            Directory
          </Link>
          <span>/</span>
          <Link
            href="/directory/games"
            className="link-draw transition-colors hover:text-primary"
          >
            Games
          </Link>
          <span>/</span>
          <span className="text-foreground">{displayName}</span>
        </nav>

        <header className="space-y-5">
          <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)]">
            {displayName} Card Shops Near Me
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {GAME_INTRO[game] ?? `Find ${gameLower} card shops near you.`}{" "}
            CardShopDir lists {shopsList.length} stores across the US that carry{" "}
            {displayName} — from sealed product and singles to grading drop-offs
            and play events. Search by city or zip, or browse by state below.
          </p>
          <SearchBox className="max-w-md" />
          <p className="text-[13px] text-muted-foreground">
            Looking for other local options?{" "}
            <Link
              href="/near-me"
              className="font-medium underline underline-offset-4 hover:text-foreground"
            >
              Browse all card shops near you
            </Link>
          </p>
        </header>
      </div>

      {/* Browse by state for this game */}
      {topStates.length > 0 && (
        <section>
          <SectionTitle
            index="01 / Places"
            title={`${displayName} Shops by State`}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {topStates.map(([st, n]) => (
              <Link
                key={st}
                href={`/directory/${st.toLowerCase()}/games/${game}`}
                className="vault-card group flex items-center justify-between rounded-sm border-2 border-ink bg-card px-3.5 py-3 text-[13px]"
              >
                <span className="font-medium">{st}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {n}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle
          index="02 / Shops"
          title={`All ${displayName} Shops`}
          aside={
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {shopsList.length} shops
            </span>
          }
        />
        <ShopGrid shops={shopsList} />
      </section>

      {/* SEO content */}
      <section className="prose prose-sm max-w-none">
        <SectionTitle
          index="03 / Guide"
          title={`Finding Local ${displayName} Stores Near You`}
        />
        <div className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
          <p>
            Looking for {gameLower} shops near you? CardShopDir connects
            collectors with {shopsList.length} local stores across the United
            States that carry {displayName}. Whether you&apos;re after the
            latest booster boxes, singles for a competitive deck, or a local
            spot to play in tournaments, our directory helps you find a nearby
            store with hours, ratings, and directions.
          </p>
          <p>
            <strong>Search by location.</strong> Use the search bar above with
            your city, state, or zip code to find {gameLower} stores in your
            area. Each listing shows the full range of games the shop carries,
            so you can confirm they stock {displayName} before you make the
            trip.
          </p>
          <p>
            <strong>Browse by state.</strong> Select your state above to see
            every listed {displayName} shop, then drill down to your city.
            State-level pages include shop counts and the most popular games
            among local collectors.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <SectionTitle index="04 / Q&A" title="Frequently Asked Questions" />
        <div className="space-y-3">
          <FaqItem
            question={`Are there ${displayName} card shops near me?`}
            answer={`Yes. CardShopDir lists ${shopsList.length} shops across the US that carry ${displayName}. Use the search bar above with your city or zip code, or browse by state above to find local ${gameLower} stores near you.`}
          />
          <FaqItem
            question={`How do I find ${displayName} shops near me?`}
            answer={`Search by city, state, or zip code using the search bar above, then filter for ${displayName}. Each shop listing includes store hours, ratings, directions, and the full range of games they carry.`}
          />
          <FaqItem
            question={`Which states have the most ${displayName} card shops?`}
            answer={
              topStates.length > 0
                ? `The states with the most ${displayName} shops in our directory are ${topStates
                    .slice(0, 3)
                    .map(([st, n]) => `${st} (${n})`)
                    .join(
                      ", "
                    )}. Browse by state above to see all listed shops.`
                : `${displayName} shops are spread across the US. Browse by state above to find shops in your area.`
            }
          />
        </div>
      </section>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-2 border-ink bg-card">
      <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-medium transition-colors hover:text-primary">
        <span className="inline-block">
          <span className="mr-2 inline-block text-muted-foreground transition-transform group-open:rotate-90">
            ›
          </span>
          {question}
        </span>
      </summary>
      <p className="px-5 pb-4 pl-10 text-[14px] leading-relaxed text-muted-foreground">
        {answer}
      </p>
    </details>
  )
}
