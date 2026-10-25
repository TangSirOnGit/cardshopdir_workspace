import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { MapPin, Phone, Globe, Mail, Clock, Star, Gamepad2 } from "lucide-react"
import { db } from "@/lib/db"
import { shops, shopGames, games, shopHours } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  stateName,
  shopTypeLabel,
  breadcrumbJsonLd,
  getNearbyShopsInCity,
  getMoreShopsInState,
} from "@/lib/directory"
import { ShopActions, ShopStickyBar } from "@/components/shop-actions"
import { ShopGrid } from "@/components/shop-card"
import { FavoriteShopButton } from "@/components/favorite-shop-button"
import { ShopViewTracker } from "@/components/shop-view-tracker"
import {
  formatTodaySummary,
  currentWeekday,
  getTodayHours,
} from "@/lib/shop-hours"
import { GAME_THEMES, gameTheme } from "@/lib/game-theme"
import { isTopRated } from "@/lib/shop-types"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) })
  if (!shop) return { title: "Shop not found — CardShopDir" }

  const locationLabel = [shop.city, shop.state].filter(Boolean).join(", ")
  const title =
    shop.metaTitle || `${shop.name} — ${locationLabel} | CardShopDir`
  const description = shop.metaDescription || (await buildShopDescription(shop))

  return {
    title,
    description,
    alternates: { canonical: `/shop/${shop.slug}` },
    openGraph: {
      title,
      description,
      images: shop.imageUrl ? [{ url: shop.imageUrl }] : undefined,
    },
  }
}

/**
 * Build a rich, SEO-friendly meta description for a shop when no
 * hand-written metaDescription is stored in the database.
 *
 * Template: "{Name} is a {type} in {city}, {state} carrying {games}.
 *            Find store hours, ratings, directions, and the games they carry."
 *
 * Falls back gracefully when games/city/state are missing.
 */
async function buildShopDescription(shop: {
  name: string
  shopType: string
  city: string | null
  state: string | null
  description: string | null
  id: number
}): Promise<string> {
  const typeLabel = shopTypeLabel(shop.shopType).toLowerCase()
  const cityState = [shop.city, stateName(shop.state || "")]
    .filter(Boolean)
    .join(", ")

  // Fetch games for this shop to enrich the description
  const gameRows = await db
    .select({ displayName: games.displayName })
    .from(games)
    .innerJoin(shopGames, eq(games.id, shopGames.gameId))
    .where(eq(shopGames.shopId, shop.id))
    .orderBy(games.sortOrder)
    .limit(4)

  const gamesPhrase =
    gameRows.length > 0
      ? ` carrying ${gameRows.map((g) => g.displayName).join(", ")}`
      : ""

  const base = `${shop.name} is a ${typeLabel} in ${cityState}${gamesPhrase}. Find store hours, ratings, directions, and the games they carry.`

  // If still under ~150 chars, append a snippet of the shop's own description
  if (base.length < 150 && shop.description) {
    const snippet = shop.description.slice(0, 160 - base.length - 1).trim()
    if (snippet) return `${base} ${snippet}`
  }

  return base
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) })

  if (!shop) {
    notFound()
  }

  // Fetch games and hours
  const [shopGameRows, hoursRows] = await Promise.all([
    db
      .select({ slug: games.slug, displayName: games.displayName })
      .from(games)
      .innerJoin(shopGames, eq(games.id, shopGames.gameId))
      .where(eq(shopGames.shopId, shop.id)),
    db
      .select()
      .from(shopHours)
      .where(eq(shopHours.shopId, shop.id))
      .orderBy(shopHours.sortOrder),
  ])

  const baseUrl = process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
  const pageUrl = `${baseUrl}/shop/${shop.slug}`
  const stateCode = shop.state || ""
  const stateFull = stateName(stateCode)
  const cityName = shop.city || ""

  // Nearby (same city) + more in state, for cross-linking.
  const nearbyShops =
    cityName && stateCode
      ? await getNearbyShopsInCity(stateCode, cityName, shop.id, 3)
      : []
  const moreInState = stateCode
    ? await getMoreShopsInState(
        stateCode,
        [shop.id, ...nearbyShops.map((s) => s.id)],
        6
      )
    : []

  const todaySummary = formatTodaySummary(hoursRows)
  const browserShop = {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    city: shop.city,
    state: shop.state,
    street: shop.street,
    telephone: shop.telephone,
    imageUrl: shop.imageUrl,
    ratingValue: shop.ratingValue,
    reviewCount: shop.reviewCount,
    shopType: shop.shopType,
    description: shop.description,
    games: shopGameRows,
    todayHours: getTodayHours(hoursRows),
    isOpenNow: todaySummary.open,
  }

  // LocalBusiness JSON-LD
  const businessJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    url: pageUrl,
    image: shop.imageUrl || undefined,
    telephone: shop.telephone || undefined,
    email: shop.email || undefined,
    website: shop.website || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: shop.street || undefined,
      addressLocality: cityName,
      addressRegion: stateCode,
      postalCode: shop.postalCode || undefined,
      addressCountry: shop.country || "US",
    },
    geo:
      shop.latitude && shop.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: shop.latitude,
            longitude: shop.longitude,
          }
        : undefined,
    aggregateRating:
      shop.ratingValue && shop.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: shop.ratingValue,
            reviewCount: shop.reviewCount,
          }
        : undefined,
    openingHoursSpecification: hoursRows.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens || undefined,
      closes: h.closes || undefined,
    })),
  }

  // Build breadcrumb items — skip state level when state is empty (international shops)
  const breadcrumbItems: { name: string; url: string }[] = [
    { name: "Home", url: baseUrl },
    { name: "Directory", url: `${baseUrl}/directory` },
  ]
  if (stateCode) {
    breadcrumbItems.push({
      name: stateFull,
      url: `${baseUrl}/directory/${stateCode.toLowerCase()}`,
    })
  }
  if (cityName && stateCode) {
    breadcrumbItems.push({
      name: cityName,
      url: `${baseUrl}/directory/${stateCode.toLowerCase()}/${cityName.toLowerCase().replace(/\s+/g, "-")}`,
    })
  }
  breadcrumbItems.push({ name: shop.name, url: pageUrl })
  const breadcrumbJsonLdData = breadcrumbJsonLd(breadcrumbItems)

  const mapsUrl =
    shop.latitude && shop.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.street || ""} ${cityName} ${stateCode}`)}`

  const heroHue = GAME_THEMES[shopGameRows[0]?.slug ?? ""]?.hue ?? 75
  const todayName = currentWeekday()
  const panel = "border-t-2 border-foreground pt-4"
  const h2Side = "font-serif text-xl font-bold tracking-tight"
  const h2Main =
    "mb-6 border-t-2 border-foreground pt-4 font-serif text-3xl font-bold tracking-tight"

  return (
    <div className="space-y-12 pt-6 pb-24 sm:pt-10 sm:pb-0">
      <ShopViewTracker shop={browserShop} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLdData),
        }}
      />

      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="label-mono flex flex-wrap items-center gap-2 tracking-[0.08em] normal-case">
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
          {stateCode && (
            <>
              <span>/</span>
              <Link
                href={`/directory/${stateCode.toLowerCase()}`}
                className="link-draw transition-colors hover:text-primary"
              >
                {stateFull}
              </Link>
            </>
          )}
          {cityName && stateCode && (
            <>
              <span>/</span>
              <Link
                href={`/directory/${stateCode.toLowerCase()}/${cityName.toLowerCase().replace(/\s+/g, "-")}`}
                className="link-draw transition-colors hover:text-primary"
              >
                {cityName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{shop.name}</span>
        </nav>

        {/* Header */}
        <header className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
          <div className="min-w-0 space-y-5 lg:py-2">
            <p className="label-mono flex items-center gap-2.5 text-foreground">
              <span className="h-2.5 w-2.5 bg-primary" />
              {shopTypeLabel(shop.shopType)}
            </p>
            <h1 className="display text-[clamp(2.4rem,5.4vw,4.75rem)]">
              {shop.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
              {shop.ratingValue && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${
                          shop.ratingValue &&
                          n <= Math.round(parseFloat(shop.ratingValue))
                            ? "fill-gold text-gold"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold">{shop.ratingValue}</span>
                  <span className="text-muted-foreground">
                    ({shop.reviewCount} reviews)
                  </span>
                </div>
              )}
              {hoursRows.length > 0 && (
                <p className="flex items-center gap-2 text-[13px]">
                  <span
                    className={`label-mono px-2 py-1 ${
                      todaySummary.open
                        ? "bg-open text-ink"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {todaySummary.status}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {todaySummary.hours}
                  </span>
                </p>
              )}
            </div>

            <p className="flex items-start gap-1.5 text-[15px] text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {shop.street && <span>{shop.street}, </span>}
                {[cityName, stateCode].filter(Boolean).join(", ")}{" "}
                {shop.postalCode}
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <ShopActions
                slug={shop.slug}
                website={shop.website}
                telephone={shop.telephone}
                mapsUrl={mapsUrl}
              />
              <FavoriteShopButton shop={browserShop} />
            </div>
          </div>

          <div
            className="relative min-h-64 overflow-hidden border-2 border-ink bg-muted shadow-[8px_8px_0_0_#04150f] lg:min-h-96"
            style={
              shop.imageUrl
                ? undefined
                : { backgroundColor: `oklch(0.84 0.115 ${heroHue})` }
            }
          >
            {shop.imageUrl ? (
              <Image
                src={shop.imageUrl}
                alt={shop.name}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-end justify-between p-5"
              >
                <span className="font-serif text-[11rem] leading-[0.75] font-bold text-ink/80">
                  {shop.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="label-mono text-ink">
                  {shopGameRows[0]?.displayName ?? "Card shop"}
                </span>
              </div>
            )}
            {isTopRated(shop) && (
              <span className="label-mono absolute top-0 right-0 bg-ink px-3 py-2 text-marigold">
                ★ Top Rated
              </span>
            )}
          </div>
        </header>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-12">
          {shop.description && (
            <section>
              <h2 className={h2Main}>About {shop.name}</h2>
              <p className="max-w-[68ch] text-[16px] leading-[1.8] whitespace-pre-line text-muted-foreground">
                {shop.description}
              </p>
            </section>
          )}

          {shopGameRows.length > 0 && (
            <section>
              <h2 className={h2Main}>What They Carry</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {shopGameRows.map((g) => {
                  const t = gameTheme(g.slug, g.displayName)
                  return (
                    <Link
                      key={g.slug}
                      href={`/directory/games/${g.slug}`}
                      className="vault-card flex aspect-4/3 flex-col justify-end rounded-sm border-2 border-ink p-3.5 text-ink"
                      style={{ backgroundColor: `oklch(0.84 0.115 ${t.hue})` }}
                    >
                      <span className="font-serif text-[20px] leading-tight font-bold tracking-tight">
                        {g.displayName}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {hoursRows.length > 0 && (
            <section>
              <h2 className={`${h2Main} flex items-center gap-2`}>
                <Clock className="h-5 w-5 text-primary" />
                Opening Hours
              </h2>
              <div className="divide-y divide-border border-y border-border">
                {hoursRows.map((h, i) => {
                  const isToday = (h.days as string[]).includes(todayName)
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-4 px-3 py-3.5 text-[14px] ${
                        isToday ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      <span
                        className={`flex items-center gap-2 ${
                          isToday ? "font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {isToday && (
                          <span className="h-1.5 w-1.5 bg-primary-foreground" />
                        )}
                        {(h.days as string[]).join(", ")}
                      </span>
                      <span className="font-medium tabular-nums">
                        {h.opens && h.closes
                          ? `${h.opens} - ${h.closes}`
                          : "Closed"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          {(shop.email || shop.telephone || shop.website) && (
            <section className={panel}>
              <h2 className={`${h2Side} mb-4`}>Contact</h2>
              <div className="space-y-3 text-[14px]">
                {shop.telephone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <a
                      href={`tel:${shop.telephone.replace(/[^0-9+]/g, "")}`}
                      className="link-draw"
                    >
                      {shop.telephone}
                    </a>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <a
                      href={`mailto:${shop.email}`}
                      className="link-draw truncate"
                    >
                      {shop.email}
                    </a>
                  </div>
                )}
                {shop.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 shrink-0 text-primary" />
                    <a
                      href={shop.website}
                      target="_blank"
                      rel="noopener nofollow"
                      className="link-draw truncate"
                    >
                      {shop.website
                        .replace(/^https?:\/\//, "")
                        .replace(/\/$/, "")}
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {shop.latitude && shop.longitude && (
            <section className={panel}>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener"
                className="group block text-[14px]"
              >
                <h2 className={`${h2Side} mb-3`}>Location</h2>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {shop.street && <span>{shop.street}, </span>}
                    {[cityName, stateCode].filter(Boolean).join(", ")}{" "}
                    {shop.postalCode}
                  </span>
                </p>
                <p className="label-mono mt-2 tracking-normal">
                  {shop.latitude}, {shop.longitude}
                </p>
                <p className="mt-3 text-[13px] font-bold tracking-wide text-primary uppercase">
                  <span className="link-draw">Open in Google Maps</span> →
                </p>
              </a>
            </section>
          )}

          {shopGameRows.length > 0 && (
            <section className={panel}>
              <h2 className={`${h2Side} mb-4 flex items-center gap-2`}>
                <Gamepad2 className="h-5 w-5 text-primary" />
                Games & Products
              </h2>
              <div className="flex flex-wrap gap-2">
                {shopGameRows.map((g) => {
                  const t = gameTheme(g.slug, g.displayName)
                  return (
                    <Link
                      key={g.slug}
                      href={`/directory/games/${g.slug}`}
                      className="rounded-sm border px-3 py-1.5 text-[12px] font-medium transition-transform hover:-translate-y-0.5 active:scale-95"
                      style={{
                        color: `oklch(0.82 0.12 ${t.hue})`,
                        backgroundColor: `oklch(0.6 0.15 ${t.hue} / 0.14)`,
                        borderColor: `oklch(0.6 0.15 ${t.hue} / 0.3)`,
                      }}
                    >
                      {g.displayName}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* Nearby shops in the same city */}
      {nearbyShops.length > 0 && (
        <section className="reveal">
          <h2 className={h2Main}>More Card Shops in {cityName}</h2>
          <ShopGrid shops={nearbyShops} />
        </section>
      )}

      {/* More shops in the same state */}
      {moreInState.length > 0 && (
        <section className="reveal">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              More Card Shops in {stateFull}
            </h2>
            <Link
              href={`/directory/${stateCode.toLowerCase()}`}
              className="group flex shrink-0 items-center gap-1.5 pb-1 text-[13px] font-medium text-primary"
            >
              <span className="link-draw">View all</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
          <ShopGrid shops={moreInState} />
        </section>
      )}

      <ShopStickyBar
        slug={shop.slug}
        website={shop.website}
        telephone={shop.telephone}
        mapsUrl={mapsUrl}
      />
    </div>
  )
}
