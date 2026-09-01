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
import { ShopActions } from "@/components/shop-actions"
import { ShopGrid } from "@/components/shop-card"
import { formatTodaySummary } from "@/lib/shop-hours"

const CARRY_ICONS: Record<string, string> = {
  pokemon: "⚡",
  "magic-the-gathering": "🪄",
  "yu-gi-oh": "🎴",
  "flesh-and-blood": "⚔️",
  sports: "⚾",
  lorcana: "✨",
  "dragon-ball-super": "🐉",
  "star-wars-unlimited": "🚀",
  "one-piece": "🏴‍☠️",
  "union-arena": "🥊",
  digimon: "🤖",
  "final-fantasy": "🗡️",
  "weiss-schwarz": "🌸",
  "cardfight-vanguard": "🛡️",
  riftbound: "🌀",
}

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) })
  if (!shop) return { title: "Shop not found — CardShopDir" }

  const title = `${shop.name} — ${shop.city}, ${shop.state} | CardShopDir`
  const description =
    shop.metaDescription ||
    `${shop.name} is a ${shopTypeLabel(shop.shopType)} in ${shop.city}, ${stateName(shop.state || "")}. ${shop.description?.slice(0, 140) || ""}`

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

  const breadcrumbJsonLdData = breadcrumbJsonLd([
    { name: "Home", url: baseUrl },
    { name: "Directory", url: `${baseUrl}/directory` },
    { name: stateFull, url: `${baseUrl}/directory/${stateCode.toLowerCase()}` },
    {
      name: cityName,
      url: `${baseUrl}/directory/${stateCode.toLowerCase()}/${cityName.toLowerCase().replace(/\s+/g, "-")}`,
    },
    { name: shop.name, url: pageUrl },
  ])

  const mapsUrl =
    shop.latitude && shop.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.street || ""} ${cityName} ${stateCode}`)}`

  return (
    <div className="space-y-8 pt-4">
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

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-foreground">
          Directory
        </Link>
        <span>/</span>
        <Link
          href={`/directory/${stateCode.toLowerCase()}`}
          className="hover:text-foreground"
        >
          {stateFull}
        </Link>
        {cityName && (
          <>
            <span>/</span>
            <Link
              href={`/directory/${stateCode.toLowerCase()}/${cityName.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-foreground"
            >
              {cityName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{shop.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {shop.imageUrl ? (
          <Image
            src={shop.imageUrl}
            alt={shop.name}
            width={200}
            height={200}
            sizes="160px"
            className="h-40 w-40 shrink-0 rounded-lg object-cover ring-1 ring-border/40"
          />
        ) : (
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
            No image
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
            {shop.name}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {shopTypeLabel(shop.shopType)}
          </p>
          {shop.ratingValue && (
            <div className="flex items-center gap-2 text-[14px]">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      shop.ratingValue &&
                      n <= Math.round(parseFloat(shop.ratingValue))
                        ? "fill-amber-500 text-amber-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{shop.ratingValue}</span>
              <span className="text-muted-foreground">
                ({shop.reviewCount} reviews)
              </span>
            </div>
          )}
          <p className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {shop.street && <span>{shop.street}, </span>}
            {cityName}, {stateCode} {shop.postalCode}
          </p>

          {/* Today's status */}
          {hoursRows.length > 0 && (
            <p className="flex items-center gap-2 text-[13px]">
              <span
                className={`flex items-center gap-1.5 font-medium ${
                  todaySummary.open
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    todaySummary.open
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/40"
                  }`}
                />
                {todaySummary.status}
              </span>
              <span className="text-muted-foreground">
                {todaySummary.hours}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <ShopActions
        slug={shop.slug}
        website={shop.website}
        telephone={shop.telephone}
        mapsUrl={mapsUrl}
      />

      {/* Description */}
      {shop.description && (
        <section className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold">About {shop.name}</h2>
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
            {shop.description}
          </p>
        </section>
      )}

      {/* What They Carry — icon grid */}
      {shopGameRows.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">What They Carry</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shopGameRows.map((g) => (
              <Link
                key={g.slug}
                href={`/directory/games/${g.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-3 text-center transition-colors hover:bg-muted/60"
              >
                <span className="text-2xl">{CARRY_ICONS[g.slug] ?? "🃏"}</span>
                <span className="text-[12px] font-medium">{g.displayName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Opening Hours */}
        {hoursRows.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Opening Hours
            </h2>
            <div className="space-y-2 rounded-lg border border-border/50 p-4">
              {hoursRows.map((h, i) => (
                <div key={i} className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">
                    {(h.days as string[]).join(", ")}
                  </span>
                  <span className="font-medium">
                    {h.opens && h.closes
                      ? `${h.opens} - ${h.closes}`
                      : "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Games */}
        {shopGameRows.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
              Games & Products
            </h2>
            <div className="flex flex-wrap gap-2">
              {shopGameRows.map((g) => (
                <Link
                  key={g.slug}
                  href={`/directory/games/${g.slug}`}
                  className="rounded-full border border-border/50 bg-muted/30 px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-muted/60"
                >
                  {g.displayName}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {(shop.email || shop.telephone || shop.website) && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Contact</h2>
            <div className="space-y-2 rounded-lg border border-border/50 p-4 text-[13px]">
              {shop.telephone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${shop.telephone.replace(/[^0-9+]/g, "")}`}
                    className="hover:underline"
                  >
                    {shop.telephone}
                  </a>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${shop.email}`} className="hover:underline">
                    {shop.email}
                  </a>
                </div>
              )}
              {shop.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener nofollow"
                    className="truncate hover:underline"
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

        {/* Map link */}
        {shop.latitude && shop.longitude && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Location</h2>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener"
              className="block rounded-lg border border-border/50 p-4 text-[13px] transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {shop.street && <span>{shop.street}, </span>}
                  {cityName}, {stateCode} {shop.postalCode}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {shop.latitude}, {shop.longitude}
              </p>
              <p className="mt-2 text-[12px] font-medium text-foreground">
                Open in Google Maps →
              </p>
            </a>
          </section>
        )}
      </div>

      {/* Nearby shops in the same city */}
      {nearbyShops.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            More Card Shops in {cityName}
          </h2>
          <ShopGrid shops={nearbyShops} />
        </section>
      )}

      {/* More shops in the same state */}
      {moreInState.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              More Card Shops in {stateFull}
            </h2>
            <Link
              href={`/directory/${stateCode.toLowerCase()}`}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <ShopGrid shops={moreInState} />
        </section>
      )}
    </div>
  )
}
