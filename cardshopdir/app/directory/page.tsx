import type { Metadata } from "next"
import Link from "next/link"
import { MapPin } from "lucide-react"
import {
  getStatesWithCounts,
  getGamesWithCounts,
  stateName,
} from "@/lib/directory"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Browse Trading Card Shops by State — CardShopDir",
  description:
    "Browse our directory of trading card shops across the United States. Find local game stores by state, city, and game category.",
  alternates: { canonical: "/directory" },
}

export default async function DirectoryPage() {
  const [states, games] = await Promise.all([
    getStatesWithCounts(),
    getGamesWithCounts(),
  ])

  const totalShops = states.reduce((sum, s) => sum + s.shopCount, 0)
  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trading Card Shop Directory",
    description: `Browse ${totalShops} trading card shops across ${states.length} states.`,
    url: `${baseUrl}/directory`,
    numberOfItems: totalShops,
  }

  return (
    <div className="space-y-8 pt-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Trading Card Shop Directory
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          Browse {totalShops.toLocaleString()} shops across {states.length}{" "}
          states. Find local game stores for Pokemon, MTG, Yu-Gi-Oh!, and more.
        </p>
      </header>

      {/* Browse by State */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          Browse by State
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {states.map((s) => (
            <Link
              key={s.state}
              href={`/directory/${s.state!.toLowerCase()}`}
              className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
            >
              <span className="font-medium">{stateName(s.state!)}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {s.shopCount}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Game */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Browse by Game</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {games.map((g) => (
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
    </div>
  )
}
