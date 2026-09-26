import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
import {
  getShopsForCity,
  getGamesWithCounts,
  getTopGamesForCity,
  getCitiesForState,
  stateName,
  cityDisplayName,
  cityIntro,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"
import { SearchBox } from "@/components/search-box"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ state: string; city: string }>
}

const CITY_METADATA: Record<string, { title: string; description: string }> = {
  "CA/LOS-ANGELES": {
    title: "Card Shops in Los Angeles, CA — Pokémon, MTG & Sports Cards",
    description:
      "Find card shops in Los Angeles, CA for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and more. Browse local stores with hours, ratings, games, and directions.",
  },
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { state, city } = await params
  const stateCode = state.toUpperCase()
  const cityName = cityDisplayName(city)
  const name = stateName(stateCode)
  const override = CITY_METADATA[`${stateCode}/${city.toUpperCase()}`]
  return {
    title:
      override?.title ??
      `Trading Card Shops in ${cityName}, ${stateCode} — CardShopDir`,
    description:
      override?.description ??
      `Find trading card and game shops in ${cityName}, ${name}. Browse local stores for Pokemon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and more with hours, ratings, and directions.`,
    alternates: { canonical: `/directory/${state}/${city}` },
  }
}

export default async function CityDirectoryPage({ params }: PageProps) {
  const { state, city } = await params
  const stateCode = state.toUpperCase()
  const cityName = cityDisplayName(city)
  const name = stateName(stateCode)

  const [shopsList, games, topGames, cities] = await Promise.all([
    getShopsForCity(stateCode, city, 60),
    getGamesWithCounts(),
    getTopGamesForCity(stateCode, cityName, 5),
    getCitiesForState(stateCode),
  ])

  if (shopsList.length === 0) {
    notFound()
  }

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/directory/${state}/${city}`

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How many card shops are in ${cityName}, ${stateCode}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${cityName}, ${name} has ${shopsList.length} trading card shops listed in our directory.`,
        },
      },
      {
        "@type": "Question",
        name: `What types of card shops are in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${cityName}'s card shops carry a range of TCG and sports card products${
            topGames.length > 0
              ? `, with the most popular being ${topGames
                  .slice(0, 3)
                  .map((g) => g.displayName)
                  .join(", ")}`
              : ""
          }. You'll find stores specializing in Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and more.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I find card shops near me in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Browse the shop listings above, or use the search bar to find card shops in ${cityName} by name. Each listing includes store hours, ratings, directions, and the games they carry.`,
        },
      },
    ],
  }

  const jsonLd = [
    collectionPageJsonLd({
      name: `Trading Card Shops in ${cityName}, ${stateCode}`,
      description: `Directory of ${shopsList.length} trading card shops in ${cityName}, ${name}.`,
      url: pageUrl,
      numberOfItems: shopsList.length,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Directory", url: `${baseUrl}/directory` },
      { name, url: `${baseUrl}/directory/${state}` },
      { name: cityName, url: pageUrl },
    ]),
    faqJsonLd,
  ]

  // Nearby cities in the same state (exclude current city)
  const nearbyCities = cities
    .filter((c) => c.city && c.city.toLowerCase() !== cityName.toLowerCase())
    .slice(0, 12)

  return (
    <div className="space-y-8 pt-4">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-foreground">
          Directory
        </Link>
        <span>/</span>
        <Link href={`/directory/${state}`} className="hover:text-foreground">
          {name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{cityName}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Trading Card Shops in {cityName}, {stateCode}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {shopsList.length} shops listed in {cityName}, {name}. Find local game
          stores for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and
          more — with hours, ratings, and directions.
        </p>
        <SearchBox className="max-w-md" />
      </header>

      {/* SEO intro */}
      <section className="prose prose-sm max-w-none">
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          {cityIntro(cityName, stateCode, {
            shopCount: shopsList.length,
            topGames: topGames.map((g) => ({
              displayName: g.displayName,
              shopCount: g.shopCount,
            })),
          })}
        </p>
      </section>

      {/* Shops */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Shops in {cityName}</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {shopsList.length} shops
          </span>
        </div>
        <ShopGrid shops={shopsList} />
      </section>

      {/* Cross-links to games */}
      {games.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Browse by Game in {cityName}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {games.slice(0, 8).map((g) => (
              <Link
                key={g.slug}
                href={`/directory/${state}/games/${g.slug}`}
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{g.displayName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Nearby cities */}
      {nearbyCities.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Card Shops in Nearby Cities
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {nearbyCities.map((c) => (
              <Link
                key={c.city}
                href={`/directory/${state}/${c.city!.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-[13px] transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{c.city}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {c.shopCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          <FaqItem
            question={`How many card shops are in ${cityName}, ${stateCode}?`}
            answer={`${cityName}, ${name} has ${shopsList.length} trading card shops listed in our directory.`}
          />
          <FaqItem
            question={`What types of card shops are in ${cityName}?`}
            answer={`${cityName}'s card shops carry a range of TCG and sports card products${
              topGames.length > 0
                ? `, with the most popular being ${topGames
                    .slice(0, 3)
                    .map((g) => g.displayName)
                    .join(", ")}`
                : ""
            }. You'll find stores specializing in Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and more.`}
          />
          <FaqItem
            question={`How do I find card shops near me in ${cityName}?`}
            answer={`Browse the shop listings above, or use the search bar to find card shops in ${cityName} by name. Each listing includes store hours, ratings, directions, and the games they carry.`}
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
