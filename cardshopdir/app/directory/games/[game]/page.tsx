import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getShopsForGame,
  getGamesWithCounts,
  gameDisplayName,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ game: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { game } = await params
  const games = await getGamesWithCounts()
  const displayName = gameDisplayName(game, games)
  return {
    title: `Shops selling ${displayName} — CardShopDir`,
    description: `Find trading card shops that carry ${displayName}. Browse local game stores across the US that sell ${displayName} products.`,
    alternates: { canonical: `/directory/games/${game}` },
  }
}

export async function generateStaticParams() {
  const games = await getGamesWithCounts()
  return games.map((g) => ({ game: g.slug }))
}

export default async function GameDirectoryPage({ params }: PageProps) {
  const { game } = await params
  const games = await getGamesWithCounts()
  const displayName = gameDisplayName(game, games)

  if (!games.find((g) => g.slug === game)) {
    notFound()
  }

  const shopsList = await getShopsForGame(game, 60)

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/directory/games/${game}`

  const jsonLd = [
    collectionPageJsonLd({
      name: `Shops selling ${displayName}`,
      description: `Directory of ${shopsList.length} shops that carry ${displayName}.`,
      url: pageUrl,
      numberOfItems: shopsList.length,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Directory", url: `${baseUrl}/directory` },
      { name: "Games", url: `${baseUrl}/directory/games` },
      { name: displayName, url: pageUrl },
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

      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-foreground">Directory</Link>
        <span>/</span>
        <Link href="/directory/games" className="hover:text-foreground">Games</Link>
        <span>/</span>
        <span className="text-foreground">{displayName}</span>
      </nav>

      <header>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Shops selling {displayName}
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          {shopsList.length} shops across the US carry {displayName}. Find a local
          store near you.
        </p>
      </header>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Shops</h2>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {shopsList.length} shops
          </span>
        </div>
        <ShopGrid shops={shopsList} />
      </section>
    </div>
  )
}
