import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin, ArrowRight } from "lucide-react"
import {
  getStatesWithCounts,
  getCitiesForState,
  getShopsForState,
  getGamesWithCounts,
  getStateStats,
  enrichShopsWithCardMeta,
  stateName,
  stateTagline,
  stateIntro,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopListWithFilters } from "@/components/shop-list-with-filters"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ state: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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

// Emoji/label map shared with the card for specialty chips.
const SPECIALTY_LABELS: Record<string, string> = {
  pokemon: "Pokémon",
  "magic-the-gathering": "MTG",
  "yu-gi-oh": "Yu-Gi-Oh!",
  sports: "Sports",
  lorcana: "Lorcana",
  "flesh-and-blood": "Flesh & Blood",
  "one-piece": "One Piece",
  "dragon-ball-super": "DBS",
  "star-wars-unlimited": "Star Wars",
  digimon: "Digimon",
  "final-fantasy": "Final Fantasy",
  "weiss-schwarz": "Weiss Schwarz",
  "cardfight-vanguard": "Vanguard",
  "union-arena": "Union Arena",
  riftbound: "Riftbound",
}

export default async function StateDirectoryPage({ params }: PageProps) {
  const { state } = await params
  const stateCode = state.toUpperCase()
  const name = stateName(stateCode)

  // Invalid state code (not in our stateName map)
  if (name === stateCode) {
    notFound()
  }

  const [cities, shopsRaw, games, stats, allStates] = await Promise.all([
    getCitiesForState(stateCode),
    getShopsForState(stateCode, 60),
    getGamesWithCounts(),
    getStateStats(stateCode),
    getStatesWithCounts(),
  ])

  if (shopsRaw.length === 0) {
    notFound()
  }

  const shopsList = await enrichShopsWithCardMeta(shopsRaw)

  // Derive specialty filters from the shops on this page.
  const specialtyCounts = new Map<string, number>()
  for (const s of shopsList) {
    for (const g of s.games ?? []) {
      specialtyCounts.set(g.slug, (specialtyCounts.get(g.slug) ?? 0) + 1)
    }
  }
  const specialties = [...specialtyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([slug, count]) => ({
      slug,
      label: SPECIALTY_LABELS[slug] ?? slug,
      count,
    }))

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

  const otherStates = allStates.filter((s) => s.state !== stateCode)

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
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-foreground">
          Directory
        </Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      {/* Header with tagline */}
      <header className="space-y-3">
        <p className="text-[12px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {stateCode} Card Shop Directory
        </p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Card Shops in {name}
        </h1>
        <p className="text-[14px] font-medium text-muted-foreground">
          {stateTagline(stateCode)}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Shops Listed" value={stats.shopCount} />
          <Stat label="Cities" value={stats.cityCount} />
          <Stat
            label="Avg Rating"
            value={stats.avgRating ? `${stats.avgRating}★` : "—"}
          />
          <Stat
            label="Total Reviews"
            value={stats.totalReviews.toLocaleString()}
          />
        </div>
      </header>

      {/* State intro */}
      <section className="prose prose-sm max-w-none">
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          {stateIntro(stateCode, cities.map((c) => c.city!).filter(Boolean))}
        </p>
      </section>

      {/* Cities with jump-to anchors */}
      {cities.length > 0 && (
        <section id="cities">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Cities in {name}
            </h2>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {cities.length} cities
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
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

      {/* All shops in state with filters */}
      <section id="all-shops">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Shops in {name}</h2>
        </div>
        <ShopListWithFilters
          shops={shopsList}
          specialties={specialties}
          scopeLabel={name}
        />
      </section>

      {/* Cross-links to games */}
      {games.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Browse by Game in {name}
          </h2>
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

      {/* Other states cross-links */}
      {otherStates.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Other States</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {otherStates.map((s) => (
              <Link
                key={s.state}
                href={`/directory/${s.state!.toLowerCase()}`}
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-2.5 py-2 text-[12px] transition-colors hover:bg-muted/60"
              >
                <span className="font-medium">{s.state}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {s.shopCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
