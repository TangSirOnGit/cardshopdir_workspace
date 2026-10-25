import type { Metadata } from "next"
import { db } from "@/lib/db"
import { shops, games, shopGames } from "@/lib/db/schema"
import { eq, desc, sql, count } from "drizzle-orm"
import Link from "next/link"
import { ArrowRight, MapPin, Star } from "lucide-react"
import { getSettingsTyped } from "@/lib/settings"
import { SITE_URL } from "@/config"
import { SearchBox } from "@/components/search-box"
import { ShopCard } from "@/components/shop-card"
import { gameTheme } from "@/lib/game-theme"
import { HeroCardFan } from "@/components/hero-card-fan"
import {
  getPopularCities,
  enrichShopsWithCardMeta,
  stateName,
} from "@/lib/directory"

export const revalidate = 3600

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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
      />
      {/* ── Hero ─────────────────────────────────────── */}
      <header className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 pt-10 pb-16 sm:pt-16 sm:pb-24 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <div className="min-w-0">
          <p
            className="rise label-mono flex items-center gap-2.5 text-foreground"
            style={{ "--d": 0 } as React.CSSProperties}
          >
            <span className="h-2.5 w-2.5 bg-primary" />
            Card Shop Directory
          </p>
          <h1
            className="rise display mt-6 text-[clamp(3rem,8.4vw,7.25rem)]"
            style={{ "--d": 1 } as React.CSSProperties}
          >
            Find Trading Card Shops{" "}
            <span className="marker text-primary italic">Near You</span>
          </h1>
          <p
            className="rise mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground"
            style={{ "--d": 2 } as React.CSSProperties}
          >
            {settings.siteDescription} Browse {totalShops.toLocaleString()}{" "}
            shops across {totalStates} states.
          </p>

          <div className="rise" style={{ "--d": 3 } as React.CSSProperties}>
            <SearchBox large className="mt-10 max-w-2xl" />
          </div>

          <div
            className="rise -mx-6 mt-6 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-6 pb-1 text-[13px] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            style={{ "--d": 4 } as React.CSSProperties}
          >
            <Link
              href="/near-me"
              className="inline-flex shrink-0 items-center gap-1.5 border-2 border-ink bg-primary px-3.5 py-1.5 text-[12px] font-bold tracking-wide text-primary-foreground uppercase shadow-[3px_3px_0_0_#04150f] transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-none"
            >
              <MapPin className="h-3.5 w-3.5" />
              Card Shops Near Me
              <ArrowRight className="h-3 w-3" />
            </Link>
            {popularCities.length > 0 && (
              <>
                <span className="label-mono ml-2 shrink-0">Popular</span>
                {popularCities.map((c) => (
                  <Link
                    key={`${c.city}-${c.state}`}
                    href={`/directory/${c.state!.toLowerCase()}/${c.city!.toLowerCase().replace(/\s+/g, "-")}`}
                    className="shrink-0 border border-foreground/40 px-3 py-1.5 font-medium transition-colors hover:bg-foreground hover:text-background"
                  >
                    {c.city}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        <HeroCardFan
          totalShops={totalShops}
          totalStates={totalStates}
          avgRating={avgRating}
        />
      </header>

      {/* ── Stats band ───────────────────────────────── */}
      <div className="bleed band-paper border-y-2 border-ink">
        <div className="grid grid-cols-2 divide-ink sm:grid-cols-4 sm:divide-x-2">
          <Stat value={totalShops.toLocaleString()} label="Total Shops" />
          <Stat value={String(totalStates)} label="States" />
          <Stat
            value={avgRating ? String(avgRating) : "—"}
            label="Avg Rating"
            icon={
              avgRating ? (
                <Star className="h-7 w-7 fill-vermilion text-vermilion" />
              ) : null
            }
          />
          <Stat value={String(topGames.length)} label="TCG Games" />
        </div>
      </div>

      {/* ── Browse by Game ───────────────────────────── */}
      <section className="pt-20 sm:pt-28">
        <SectionHead
          index="01 / Games"
          title="Browse by Game"
          href="/directory/games"
          cta="All games"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {topGames.map((g, i) => {
            const t = gameTheme(g.slug, g.displayName)
            return (
              <Link
                key={g.slug}
                href={`/directory/games/${g.slug}`}
                className="vault-card flex aspect-4/3 flex-col justify-between rounded-sm border-2 border-ink p-3.5 text-ink sm:p-4"
                style={{ backgroundColor: `oklch(0.84 0.115 ${t.hue})` }}
              >
                <span className="flex items-start justify-between">
                  <span className="label-mono text-ink">
                    No. {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-3xl leading-none font-bold tabular-nums sm:text-4xl">
                    {g.shopCount.toLocaleString()}
                  </span>
                </span>
                <span className="font-serif text-[19px] leading-[1.05] font-bold tracking-tight sm:text-[22px]">
                  {g.displayName}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Featured Shops ───────────────────────────── */}
      <div className="bleed band-deep mt-20 border-y-2 border-ink py-16 sm:mt-28 sm:py-24">
        <section>
          <SectionHead
            index="02 / Top picks"
            title="Featured Shops"
            href="/directory"
            cta="View all"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </section>
      </div>

      {/* ── Browse by State ──────────────────────────── */}
      <section className="pt-20 sm:pt-28">
        <SectionHead
          index="03 / Places"
          title="Browse by State"
          href="/directory"
          cta="All states"
        />
        <ul className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {popularStates.map((s) => (
            <li key={s.state}>
              <Link
                href={`/directory/${s.state?.toLowerCase()}`}
                className="group flex items-baseline gap-3 border-b border-border py-3 transition-colors hover:text-primary"
              >
                <span className="font-serif text-[20px] font-semibold tracking-tight">
                  {stateName(s.state || "")}
                </span>
                <span
                  aria-hidden="true"
                  className="flex-1 translate-y-[-4px] border-b-2 border-dotted border-muted-foreground/40"
                />
                <span className="label-mono tracking-normal tabular-nums group-hover:text-primary">
                  {s.shopCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── About / value proposition ────────────────── */}
      <div className="bleed band-paper mt-20 border-y-2 border-ink py-16 sm:mt-28 sm:py-24">
        <section>
          <p className="label-mono text-primary">About CardShopDir</p>
          <h2 className="display mt-4 max-w-3xl text-[clamp(2.2rem,5vw,4rem)]">
            The Collector&apos;s Guide to Local Card Shops
          </h2>
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.75] text-muted-foreground">
            CardShopDir connects collectors with vetted local card stores
            carrying Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and
            more — complete with store hours, ratings, directions, and the games
            they carry. From major metro hubs to hidden gems in smaller
            communities, we&apos;re building the most comprehensive card shop
            directory in the country.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <ValueCard
              n="01"
              title="Every Card Type"
              body="Pokémon, MTG, Yu-Gi-Oh!, sports cards, Flesh & Blood, Lorcana, and more."
            />
            <ValueCard
              n="02"
              title="Verified Ratings"
              body="Real ratings and review counts from Google so you know what to expect."
            />
            <ValueCard
              n="03"
              title="Hours & Status"
              body="See today's hours and whether a shop is open right now before you go."
            />
            <ValueCard
              n="04"
              title="Nationwide Coverage"
              body={`Growing directory spanning ${totalStates} states, with new shops added regularly.`}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string
  label: string
  icon?: React.ReactNode
}) {
  return (
    <div className="border-ink px-5 py-8 max-sm:odd:border-r-2 max-sm:nth-[-n+2]:border-b-2 sm:px-8 sm:py-10">
      <p className="flex items-center gap-2 font-serif text-5xl leading-none font-bold tracking-tighter tabular-nums sm:text-6xl">
        {value}
        {icon}
      </p>
      <p className="label-mono mt-3 text-ink">{label}</p>
    </div>
  )
}

function SectionHead({
  index,
  title,
  href,
  cta,
}: {
  index: string
  title: string
  href: string
  cta: string
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-t-2 border-foreground pt-4">
      <div>
        <p className="label-mono text-primary">{index}</p>
        <h2 className="mt-2 font-serif text-[2rem] leading-none font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-1.5 pb-1 text-[13px] font-bold tracking-wide text-primary uppercase"
      >
        <span className="link-draw">{cta}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}

function ValueCard({
  n,
  title,
  body,
}: {
  n: string
  title: string
  body: string
}) {
  return (
    <div className="border-t-2 border-ink pt-4">
      <p className="label-mono text-primary">{n}</p>
      <h3 className="mt-2 font-serif text-[22px] leading-tight font-bold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
