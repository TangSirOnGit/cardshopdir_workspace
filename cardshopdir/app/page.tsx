import type { Metadata } from "next"
import { db } from "@/lib/db"
import { shops, games, shopGames } from "@/lib/db/schema"
import { eq, desc, sql, count } from "drizzle-orm"
import Link from "next/link"
import { ArrowRight, MapPin, Gamepad2, Star } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"
import { SITE_URL } from "@/config"
import { SearchBox } from "@/components/search-box"
import { ShopCard } from "@/components/shop-card"
import { getPopularCities, enrichShopsWithCardMeta } from "@/lib/directory"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Card Shop Directory — Find Trading Card Shops Near You",
  description:
    "Browse 7,700+ trading card shops across all 50 US states. Find local game stores for Pokemon, Magic: The Gathering, Yu-Gi-Oh!, Flesh and Blood, and more.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Card Shop Directory — Find Trading Card Shops Near You",
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
    totalStates,
    avgRatingRow,
    topGames,
    featuredShopsRaw,
    popularStates,
    popularCities,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(shops)
      .then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(distinct ${shops.state})::int` })
      .from(shops)
      .where(sql`${shops.state} is not null`)
      .then((r) => r[0].count),
    // Average rating across indexed shops
    db
      .select({
        avg: sql<number>`round(avg(${shops.ratingValue})::numeric, 1)`,
      })
      .from(shops)
      .where(eq(shops.shouldIndex, true))
      .then((r) => r[0]?.avg ?? null),
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
        street: shops.street,
        telephone: shops.telephone,
        imageUrl: shops.imageUrl,
        ratingValue: shops.ratingValue,
        reviewCount: shops.reviewCount,
        shopType: shops.shopType,
        description: shops.description,
      })
      .from(shops)
      .where(eq(shops.shouldIndex, true))
      .orderBy(desc(shops.ratingValue), desc(shops.reviewCount))
      .limit(6),
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
    // Popular cities for quick links
    getPopularCities(6),
  ])

  const avgRating = avgRatingRow ? Number(avgRatingRow) : null
  const featuredShops = await enrichShopsWithCardMeta(featuredShopsRaw)

  const searchActionJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Card Shop Directory",
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
        <p className="text-[13px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Card Shop Directory
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl md:text-5xl">
          Find Trading Card Shops
          <br />
          <span className="text-muted-foreground">Near You</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {settings.siteDescription} Browse {totalShops.toLocaleString()} shops
          across {totalStates} states.
        </p>

        {/* Search bar */}
        <SearchBox className="mx-auto mt-6 max-w-md" />

        {/* Popular city quick links */}
        {popularCities.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Popular:</span>
            {popularCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/directory/${c.state!.toLowerCase()}/${c.city!.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-full border border-border/50 bg-muted/30 px-3 py-1 font-medium transition-colors hover:bg-muted/60"
              >
                {c.city}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          <p className="flex items-center justify-center gap-1 text-2xl font-semibold tabular-nums">
            {avgRating ? (
              <>
                {avgRating}
                <Star className="h-5 w-5 fill-current text-amber-500" />
              </>
            ) : (
              "—"
            )}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Avg Rating</p>
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
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>

      {/* ── About / value proposition ────────────────── */}
      <section className="rounded-xl border border-border/50 bg-muted/20 p-6 sm:p-8">
        <p className="text-center text-[12px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          About CardShopDir
        </p>
        <h2 className="mt-2 text-center font-serif text-2xl tracking-tight sm:text-3xl">
          The Collector&apos;s Guide to Local Card Shops
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] leading-relaxed text-muted-foreground">
          CardShopDir connects collectors with vetted local card stores carrying
          Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and more —
          complete with store hours, ratings, directions, and the games they
          carry. From major metro hubs to hidden gems in smaller communities,
          we&apos;re building the most comprehensive card shop directory in the
          country.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard
            icon="🃏"
            title="Every Card Type"
            body="Pokémon, MTG, Yu-Gi-Oh!, sports cards, Flesh & Blood, Lorcana, and more."
          />
          <ValueCard
            icon="★"
            title="Verified Ratings"
            body="Real ratings and review counts from Google so you know what to expect."
          />
          <ValueCard
            icon="🕒"
            title="Hours & Status"
            body="See today's hours and whether a shop is open right now before you go."
          />
          <ValueCard
            icon="📍"
            title="Nationwide Coverage"
            body={`Growing directory spanning ${totalStates} states, with new shops added regularly.`}
          />
        </div>
      </section>
    </div>
  )
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background p-4">
      <p className="text-2xl">{icon}</p>
      <h3 className="mt-2 text-[14px] font-semibold">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
