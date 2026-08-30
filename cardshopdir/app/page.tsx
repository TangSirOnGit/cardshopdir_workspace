import type { Metadata } from "next"
import { db } from "@/lib/db"
import { shops, games, shopGames } from "@/lib/db/schema"
import { eq, desc, sql, count } from "drizzle-orm"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Gamepad2, Search } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"
import { SITE_URL } from "@/config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "CardShopDir — Find Trading Card Shops Near You",
  description:
    "Browse 7,700+ trading card shops across all 50 US states. Find local game stores for Pokemon, Magic: The Gathering, Yu-Gi-Oh!, Flesh and Blood, and more.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CardShopDir — Find Trading Card Shops Near You",
    description:
      "Browse 7,700+ trading card shops across all 50 US states. Find local game stores for Pokemon, MTG, Yu-Gi-Oh!, and more.",
    url: SITE_URL,
    type: "website",
  },
}

export default async function Home() {
  const settings = await getSettingsTyped()

  // Fetch stats and featured data in parallel
  const [
    totalShops,
    indexedShops,
    totalStates,
    topGames,
    featuredShops,
    popularStates,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(shops)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(shops)
      .where(eq(shops.shouldIndex, true))
      .then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(distinct ${shops.state})::int` })
      .from(shops)
      .where(sql`${shops.state} is not null`)
      .then((r) => r[0].count),
    // Top games by shop count
    db
      .select({
        slug: games.slug,
        displayName: games.displayName,
        shopCount: sql<number>`count(${shopGames.shopId})::int`,
      })
      .from(games)
      .leftJoin(shopGames, eq(games.id, shopGames.gameId))
      .groupBy(games.id, games.slug, games.displayName)
      .orderBy(desc(sql`count(${shopGames.shopId})`))
      .limit(8),
    // Featured shops (high rating + indexed)
    db
      .select({
        id: shops.id,
        slug: shops.slug,
        name: shops.name,
        city: shops.city,
        state: shops.state,
        imageUrl: shops.imageUrl,
        ratingValue: shops.ratingValue,
        reviewCount: shops.reviewCount,
        shopType: shops.shopType,
      })
      .from(shops)
      .where(eq(shops.shouldIndex, true))
      .orderBy(desc(shops.ratingValue), desc(shops.reviewCount))
      .limit(12),
    // Popular states by shop count
    db
      .select({
        state: shops.state,
        shopCount: sql<number>`count(*)::int`,
      })
      .from(shops)
      .where(sql`${shops.state} is not null and ${shops.state} != ''`)
      .groupBy(shops.state)
      .orderBy(desc(sql`count(*)`))
      .limit(12),
  ])

  const searchActionJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CardShopDir",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/directory/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <div className="space-y-12 pt-4 sm:pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
      />
      {/* ── Hero ─────────────────────────────────────── */}
      <header className="text-center">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl">
          Find Trading Card Shops
          <br />
          <span className="text-muted-foreground">Near You</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {settings.siteDescription} Browse {totalShops.toLocaleString()} shops
          across {totalStates} states.
        </p>

        {/* Search bar */}
        <form action="/directory/search" className="mx-auto mt-6 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              name="q"
              placeholder="Search by city, state, or shop name..."
              className="h-11 w-full rounded-lg border border-border bg-background pr-4 pl-10 text-[14px] transition-colors outline-none focus:border-foreground/30"
            />
          </div>
        </form>
      </header>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">
            {totalShops.toLocaleString()}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Total Shops</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{totalStates}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">States</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">
            {topGames.length}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">TCG Games</p>
        </div>
      </div>

      {/* ── Browse by State ──────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            Browse by State
          </h2>
          <Link
            href="/directory"
            className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            All states
            <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {popularStates.map((s) => (
            <Link
              key={s.state}
              href={`/directory/${s.state?.toLowerCase()}`}
              className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/60"
            >
              <span className="font-medium">{s.state}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {s.shopCount}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Browse by Game ───────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Gamepad2 className="h-5 w-5 text-muted-foreground" />
            Browse by Game
          </h2>
          <Link
            href="/directory/games"
            className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            All games
            <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {topGames.map((g) => (
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

      {/* ── Featured Shops ───────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured Shops</h2>
          <Link
            href="/directory"
            className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredShops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shop/${shop.slug}`}
              className="group flex gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
            >
              {shop.imageUrl ? (
                <Image
                  src={shop.imageUrl}
                  alt={shop.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 shrink-0 rounded-md object-cover ring-1 ring-border/40"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] text-muted-foreground">
                  No image
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold transition-colors group-hover:text-muted-foreground">
                  {shop.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {shop.city}, {shop.state}
                </p>
                {shop.ratingValue && (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {shop.ratingValue}
                    </span>{" "}
                    ({shop.reviewCount} reviews)
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground/60 capitalize">
                  {shop.shopType.replace(/_/g, " ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
