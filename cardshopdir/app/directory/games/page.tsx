import type { Metadata } from "next"
import Link from "next/link"
import { getGamesWithCounts } from "@/lib/directory"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Browse Trading Card Shops by Game — CardShopDir",
  description:
    "Browse trading card shops by game category. Find stores for Pokemon, Magic: The Gathering, Yu-Gi-Oh!, Flesh and Blood, and more.",
  alternates: { canonical: "/directory/games" },
}

export default async function GamesIndexPage() {
  const games = await getGamesWithCounts()
  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trading Card Shops by Game",
    description: `Browse shops across ${games.length} game categories.`,
    url: `${baseUrl}/directory/games`,
  }

  return (
    <div className="space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <span className="text-foreground">Games</span>
        </nav>

        <header className="space-y-4">
          <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)]">
            Browse by Game
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Find shops that carry your favorite trading card games. Browse by
            game category below.
          </p>
        </header>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <Link
            key={g.slug}
            href={`/directory/games/${g.slug}`}
            className="vault-card group flex items-center justify-between rounded-sm border-2 border-ink bg-card px-4 py-3.5"
          >
            <div>
              <p className="text-[14px] font-semibold">{g.displayName}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {g.shopCount} shops
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
