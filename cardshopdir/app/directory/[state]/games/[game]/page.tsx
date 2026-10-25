import type { Metadata } from "next"
import Link from "next/link"
import { SectionTitle } from "@/components/section-title"
import { notFound } from "next/navigation"
import {
  getShopsForStateGame,
  getGamesWithCounts,
  stateName,
  gameDisplayName,
  collectionPageJsonLd,
  breadcrumbJsonLd,
} from "@/lib/directory"
import { ShopGrid } from "@/components/shop-card"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ state: string; game: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { state, game } = await params
  const stateCode = state.toUpperCase()
  const name = stateName(stateCode)
  const games = await getGamesWithCounts()
  const gameName = gameDisplayName(game, games)
  return {
    title: `${gameName} Shops in ${name} (${stateCode}) — CardShopDir`,
    description: `Find shops selling ${gameName} in ${name}. Browse local game stores in ${stateCode} that carry ${gameName} products.`,
    alternates: { canonical: `/directory/${state}/games/${game}` },
  }
}

export default async function StateGamePage({ params }: PageProps) {
  const { state, game } = await params
  const stateCode = state.toUpperCase()
  const name = stateName(stateCode)
  const games = await getGamesWithCounts()
  const gameName = gameDisplayName(game, games)

  if (!games.find((g) => g.slug === game)) {
    notFound()
  }

  const shopsList = await getShopsForStateGame(stateCode, game, 60)

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/directory/${state}/games/${game}`

  const jsonLd = [
    collectionPageJsonLd({
      name: `${gameName} Shops in ${name}`,
      description: `Directory of ${shopsList.length} shops selling ${gameName} in ${name} (${stateCode}).`,
      url: pageUrl,
      numberOfItems: shopsList.length,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Directory", url: `${baseUrl}/directory` },
      { name, url: `${baseUrl}/directory/${state}` },
      { name: gameName, url: pageUrl },
    ]),
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
            href={`/directory/${state}`}
            className="link-draw transition-colors hover:text-primary"
          >
            {name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{gameName}</span>
        </nav>

        <header className="space-y-4">
          <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)]">
            {gameName} Shops in {name}
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            {shopsList.length} shops in {name} ({stateCode}) carry {gameName}.
          </p>
        </header>
      </div>

      <section>
        <SectionTitle
          index="01 / Shops"
          title="All Shops"
          aside={
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {shopsList.length} shops
            </span>
          }
        />
        <ShopGrid shops={shopsList} />
      </section>
    </div>
  )
}
