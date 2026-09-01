import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getShopsForCity,
  getGamesWithCounts,
  stateName,
  cityDisplayName,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ state: string; city: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { state, city } = await params
  const stateCode = state.toUpperCase()
  const cityName = cityDisplayName(city)
  const name = stateName(stateCode)
  return {
    title: `Trading Card Shops in ${cityName}, ${stateCode} — CardShopDir`,
    description: `Find trading card and game shops in ${cityName}, ${name}. Browse local stores for Pokemon, Magic: The Gathering, Yu-Gi-Oh!, and more.`,
    alternates: { canonical: `/directory/${state}/${city}` },
  }
}

export default async function CityDirectoryPage({ params }: PageProps) {
  const { state, city } = await params
  const stateCode = state.toUpperCase()
  const cityName = cityDisplayName(city)
  const name = stateName(stateCode)

  const [shopsList, games] = await Promise.all([
    getShopsForCity(stateCode, city, 60),
    getGamesWithCounts(),
  ])

  if (shopsList.length === 0) {
    notFound()
  }

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/directory/${state}/${city}`

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

      <header>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Trading Card Shops in {cityName}, {stateCode}
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          {shopsList.length} shops listed in {cityName}, {name}. Find local game
          stores for your favorite TCGs.
        </p>
      </header>

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
    </div>
  )
}
