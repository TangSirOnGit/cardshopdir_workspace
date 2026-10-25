import type { Metadata } from "next"
import Link from "next/link"
import { SectionTitle } from "@/components/section-title"
import {
  getStatesWithCounts,
  getGamesWithCounts,
  stateName,
} from "@/lib/directory"

export const revalidate = 3600

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
    <div className="space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bleed band-paper -mt-1 space-y-5 border-b-2 border-ink py-10 sm:py-14">
        <p className="label-mono text-primary">Directory / All states</p>
        <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)]">
          Trading Card Shop Directory
        </h1>
        <p className="max-w-xl text-[16px] leading-relaxed text-muted-foreground">
          Browse {totalShops.toLocaleString()} shops across {states.length}{" "}
          states. Find local game stores for Pokemon, MTG, Yu-Gi-Oh!, and more.
        </p>
      </header>

      {/* Browse by State */}
      <section>
        <SectionTitle index="01 / Places" title="Browse by State" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {states.map((s) => (
            <Link
              key={s.state}
              href={`/directory/${s.state!.toLowerCase()}`}
              className="vault-card group flex items-center justify-between rounded-sm border-2 border-ink bg-card px-3.5 py-3 text-[13px]"
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
        <SectionTitle index="02 / Games" title="Browse by Game" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {games.map((g) => (
            <Link
              key={g.slug}
              href={`/directory/games/${g.slug}`}
              className="vault-card group flex items-center justify-between rounded-sm border-2 border-ink bg-card px-3.5 py-3 text-[13px]"
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
