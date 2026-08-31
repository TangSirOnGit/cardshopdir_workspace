import { db } from "@/lib/db"
import { shops, shopGames, games } from "@/lib/db/schema"
import { eq, and, sql, ilike, desc, or } from "drizzle-orm"
import type { ShopListItem } from "@/lib/shop-types"

// Re-export shared types and helpers (safe for client/server)
export { type ShopListItem, shopTypeLabel } from "@/lib/shop-types"

// ── Queries ────────────────────────────────────────────────────

/** Get all states with shop counts, sorted by count desc then state asc */
export async function getStatesWithCounts() {
  return db
    .select({
      state: shops.state,
      shopCount: sql<number>`count(*)::int`,
    })
    .from(shops)
    .where(sql`${shops.state} is not null and ${shops.state} != ''`)
    .groupBy(shops.state)
    .orderBy(desc(sql`count(*)`), sql`${shops.state} asc`)
}

/** Get all cities for a state with shop counts */
export async function getCitiesForState(state: string) {
  const statePattern = state.toUpperCase()
  return db
    .select({
      city: shops.city,
      shopCount: sql<number>`count(*)::int`,
    })
    .from(shops)
    .where(
      and(
        eq(shops.state, statePattern),
        sql`${shops.city} is not null and ${shops.city} != ''`
      )
    )
    .groupBy(shops.city)
    .orderBy(desc(sql`count(*)`), sql`${shops.city} asc`)
}

/** Get shops for a specific state */
export async function getShopsForState(
  state: string,
  limit = 50
): Promise<ShopListItem[]> {
  const statePattern = state.toUpperCase()
  return db
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
      description: shops.description,
    })
    .from(shops)
    .where(eq(shops.state, statePattern))
    .orderBy(
      desc(shops.shouldIndex),
      desc(shops.ratingValue),
      desc(shops.reviewCount)
    )
    .limit(limit)
}

/** Get shops for a specific state + city */
export async function getShopsForCity(
  state: string,
  city: string,
  limit = 50
): Promise<ShopListItem[]> {
  const statePattern = state.toUpperCase()
  // City slug to display name: "los-angeles" -> "Los Angeles"
  const cityName = city
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return db
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
      description: shops.description,
    })
    .from(shops)
    .where(and(eq(shops.state, statePattern), ilike(shops.city, cityName)))
    .orderBy(
      desc(shops.shouldIndex),
      desc(shops.ratingValue),
      desc(shops.reviewCount)
    )
    .limit(limit)
}

/** Get all games with shop counts */
export async function getGamesWithCounts() {
  return db
    .select({
      id: games.id,
      slug: games.slug,
      displayName: games.displayName,
      shopCount: sql<number>`count(${shopGames.shopId})::int`,
    })
    .from(games)
    .leftJoin(shopGames, eq(games.id, shopGames.gameId))
    .groupBy(games.id, games.slug, games.displayName)
    .orderBy(
      desc(sql`count(${shopGames.shopId})`),
      sql`${games.displayName} asc`
    )
}

/** Get shops for a specific game */
export async function getShopsForGame(
  gameSlug: string,
  limit = 50
): Promise<ShopListItem[]> {
  return db
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
      description: shops.description,
    })
    .from(shops)
    .innerJoin(shopGames, eq(shops.id, shopGames.shopId))
    .innerJoin(games, eq(shopGames.gameId, games.id))
    .where(eq(games.slug, gameSlug))
    .orderBy(
      desc(shops.shouldIndex),
      desc(shops.ratingValue),
      desc(shops.reviewCount)
    )
    .limit(limit)
}

/** Get shops for a specific state + game */
export async function getShopsForStateGame(
  state: string,
  gameSlug: string,
  limit = 50
): Promise<ShopListItem[]> {
  const statePattern = state.toUpperCase()
  return db
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
      description: shops.description,
    })
    .from(shops)
    .innerJoin(shopGames, eq(shops.id, shopGames.shopId))
    .innerJoin(games, eq(shopGames.gameId, games.id))
    .where(and(eq(shops.state, statePattern), eq(games.slug, gameSlug)))
    .orderBy(
      desc(shops.shouldIndex),
      desc(shops.ratingValue),
      desc(shops.reviewCount)
    )
    .limit(limit)
}

/** Search shops by query string (name, city, state, street, zip) */
export async function searchShops(
  query: string,
  limit = 30
): Promise<ShopListItem[]> {
  const pattern = `%${query}%`

  // If the query matches a full state name (e.g. "California"),
  // also match the state code (e.g. "CA") stored in the database.
  const stateCode = STATE_CODE_BY_NAME[query.toLowerCase()]
  const statePattern = stateCode ? `%${stateCode}%` : pattern

  return db
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
      description: shops.description,
    })
    .from(shops)
    .where(
      or(
        ilike(shops.name, pattern),
        ilike(shops.city, pattern),
        ilike(shops.state, statePattern),
        ilike(shops.street, pattern),
        ilike(shops.postalCode, pattern)
      )
    )
    .orderBy(desc(shops.shouldIndex), desc(shops.ratingValue))
    .limit(limit)
}

// ── JSON-LD Helpers ────────────────────────────────────────────

export function collectionPageJsonLd(opts: {
  name: string
  description: string
  url: string
  numberOfItems: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    numberOfItems: opts.numberOfItems,
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ── Display helpers ────────────────────────────────────────────

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
}

// Reverse lookup: full state name → code (e.g. "California" → "CA")
const STATE_CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code])
)

export function stateName(stateCode: string): string {
  return STATE_NAMES[stateCode?.toUpperCase()] || stateCode
}

export function cityDisplayName(citySlug: string): string {
  return citySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function gameDisplayName(
  slug: string,
  games: { slug: string; displayName: string }[]
): string {
  return games.find((g) => g.slug === slug)?.displayName || slug
}
