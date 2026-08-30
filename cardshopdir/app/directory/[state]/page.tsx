import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin, ArrowRight } from "lucide-react"
import {
  getStatesWithCounts,
  getCitiesForState,
  getShopsForState,
  getGamesWithCounts,
  stateName,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ state: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params
  const stateCode = state.toUpperCase()
  const name = stateName(stateCode)
  return {
    title: `Trading Card Shops in ${name} (${stateCode}) — CardShopDir`,
    description: `Find trading card and game shops in ${name}. Browse our directory of local stores for Pokemon, Magic: The Gathering, Yu-Gi-Oh!, and more in ${stateCode}.`,
    alternates: { canonical: `/directory/${state}` },
  }
}

export async function generateStaticParams() {
  const states = await getStatesWithCounts()
  return states.map((s) => ({ state: s.state!.toLowerCase() }))
}

export default async function StateDirectoryPage({ params }: PageProps) {
  const { state } = await params
  const stateCode = state.toUpperCase()
  const name = stateName(stateCode)

  if (!name || name === stateCode && state.length > 3) {
    notFound()
  }

  const [cities, shopsList, games] = await Promise.all([
    getCitiesForState(stateCode),
    getShopsForState(stateCode, 60),
    getGamesWithCounts(),
  ])

  if (shopsList.length === 0) {
    notFound()
  }

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/directory/${state}`

  const jsonLd = [
    collectionPageJsonLd({
      name: `Trading Card Shops in ${name}`,
      description: `Directory of ${shopsList.length} trading card shops in ${name} (${stateCode}).`,
      url: pageUrl,
      numberOfItems: shopsList.length,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Directory", url: `${baseUrl}/directory` },
      { name, url: pageUrl },
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
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-foreground">Directory</Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <header>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Trading Card Shops in {name}
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          {shopsList.length} shops listed in {name} ({stateCode}). Browse by city
          below or view all shops.
        </p>
      </header>

      {/* Cities */}
      {cities.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            Cities in {name}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cities.map((c) => (
              <Link
                key={c.city}
                href={`/directory/${state}/${c.city!.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
              >
                <span className="truncate font-medium">{c.city}</span>
                <span className="ml-2 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                  {c.shopCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All shops in state */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Shops in {name}</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {shopsList.length} shops
          </span>
        </div>
        <ShopGrid shops={shopsList} />
      </section>

      {/* Cross-links to games */}
      {games.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Browse by Game in {name}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {games.slice(0, 8).map((g) => (
              <Link
                key={g.slug}
                href={`/directory/${state}/games/${g.slug}`}
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{g.displayName}</span>
                <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
