import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { game } = await params
  const games = await getGamesWithCounts()
  const displayName = gameDisplayName(game, games)
  return {
    title: `${displayName} Card Shops Near Me & Across the US — CardShopDir`,
    description: `Find ${displayName} card shops near you. Browse local game stores across the US that sell ${displayName} products, with hours, ratings, and directions.`,
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
    <div className="space-y-8 pt-4">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-foreground">
          Directory
        </Link>
        <span>/</span>
        <Link href="/directory/games" className="hover:text-foreground">
          Games
        </Link>
        <span>/</span>
        <span className="text-foreground">{displayName}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          {displayName} Card Shops Near Me
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Find {gameLower} card shops near you. CardShopDir lists{" "}
          {shopsList.length} stores across the US that carry {displayName} —
          from sealed product and singles to grading drop-offs and play events.
          Search by city or zip, or browse by state below.
        </p>
        <SearchBox className="max-w-md" />
      </header>

      {/* Browse by state for this game */}
      {topStates.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {displayName} Shops by State
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {topStates.map(([st, n]) => (
              <Link
                key={st}
                href={`/directory/${st.toLowerCase()}/games/${game}`}
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All {displayName} Shops</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {shopsList.length} shops
          </span>
        </div>
        <ShopGrid shops={shopsList} />
      </section>

      {/* SEO content */}
      <section className="prose prose-sm max-w-none">
        <h2 className="text-lg font-semibold">
          Finding Local {displayName} Stores Near You
        </h2>
        <div className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
          <p>
            Looking for {gameLower} shops near you? CardShopDir connects
            collectors with {shopsList.length} local stores across the United
            States that carry {displayName}. Whether you're after the latest
            booster boxes, singles for a competitive deck, or a local spot to
            play in tournaments, our directory helps you find a nearby store
            with hours, ratings, and directions.
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
        <h2 className="mb-4 text-lg font-semibold">
          Frequently Asked Questions
        </h2>
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
