import { db } from "@/lib/db"
import { shops, shopGames, games, shopHours } from "@/lib/db/schema"
import {
  eq,
  and,
  sql,
  ilike,
  desc,
  or,
  ne,
  inArray,
  notInArray,
} from "drizzle-orm"
import type { ShopListItem, ShopGameTag } from "@/lib/shop-types"
import { getTodayHours, isOpenNow } from "@/lib/shop-hours"

// Re-export shared types and helpers (safe for client/server)
export {
  type ShopListItem,
  type ShopGameTag,
  shopTypeLabel,
  isTopRated,
} from "@/lib/shop-types"

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
      street: shops.street,
      telephone: shops.telephone,
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
      street: shops.street,
      telephone: shops.telephone,
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
      street: shops.street,
      telephone: shops.telephone,
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
      street: shops.street,
      telephone: shops.telephone,
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
      street: shops.street,
      telephone: shops.telephone,
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

// ── Popular cities (for homepage quick links) ───────────────────

export async function getPopularCities(limit = 6) {
  return db
    .select({
      city: shops.city,
      state: shops.state,
      shopCount: sql<number>`count(*)::int`,
    })
    .from(shops)
    .where(
      sql`${shops.city} is not null and ${shops.city} != '' and ${shops.state} is not null`
    )
    .groupBy(shops.city, shops.state)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)
}

// ── Card enrichment ─────────────────────────────────────────────

/**
 * Batch-enrich shop rows with their game tags + today's hours / open status.
 * Runs two extra queries (games, hours) for the whole batch and merges.
 */
export async function enrichShopsWithCardMeta(
  shopRows: ShopListItem[]
): Promise<ShopListItem[]> {
  if (shopRows.length === 0) return shopRows
  const ids = shopRows.map((s) => s.id)

  const [gameRows, hoursRows] = await Promise.all([
    db
      .select({
        shopId: shopGames.shopId,
        slug: games.slug,
        displayName: games.displayName,
        sortOrder: games.sortOrder,
      })
      .from(shopGames)
      .innerJoin(games, eq(shopGames.gameId, games.id))
      .where(inArray(shopGames.shopId, ids)),
    db
      .select({
        shopId: shopHours.shopId,
        days: shopHours.days,
        opens: shopHours.opens,
        closes: shopHours.closes,
      })
      .from(shopHours)
      .where(inArray(shopHours.shopId, ids)),
  ])

  const gamesByShop = new Map<number, ShopGameTag[]>()
  for (const g of gameRows) {
    const arr = gamesByShop.get(g.shopId) ?? []
    arr.push({ slug: g.slug, displayName: g.displayName })
    gamesByShop.set(g.shopId, arr)
  }

  const hoursByShop = new Map<
    number,
    { days: unknown; opens: string | null; closes: string | null }[]
  >()
  for (const h of hoursRows) {
    const arr = hoursByShop.get(h.shopId) ?? []
    arr.push({ days: h.days, opens: h.opens, closes: h.closes })
    hoursByShop.set(h.shopId, arr)
  }

  return shopRows.map((s) => {
    const hours = hoursByShop.get(s.id) ?? []
    return {
      ...s,
      games: gamesByShop.get(s.id),
      todayHours: getTodayHours(
        hours as {
          days: string[]
          opens: string | null
          closes: string | null
        }[]
      ),
      isOpenNow: isOpenNow(
        hours as {
          days: string[]
          opens: string | null
          closes: string | null
        }[]
      ),
    }
  })
}

// ── Nearby shops (for shop detail page) ─────────────────────────

/** Same-city shops excluding the current one, limited. */
export async function getNearbyShopsInCity(
  state: string,
  city: string,
  excludeId: number,
  limit = 3
): Promise<ShopListItem[]> {
  const statePattern = state.toUpperCase()
  const rows = await db
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
    .where(
      and(
        eq(shops.state, statePattern),
        ilike(shops.city, city),
        ne(shops.id, excludeId)
      )
    )
    .orderBy(desc(shops.ratingValue), desc(shops.reviewCount))
    .limit(limit)
  return enrichShopsWithCardMeta(rows)
}

/** Same-state shops excluding the current one + already-shown nearby, limited. */
export async function getMoreShopsInState(
  state: string,
  excludeIds: number[],
  limit = 6
): Promise<ShopListItem[]> {
  const statePattern = state.toUpperCase()
  const rows = await db
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
    .where(
      and(
        eq(shops.state, statePattern),
        excludeIds.length > 0 ? notInArray(shops.id, excludeIds) : undefined
      )
    )
    .orderBy(desc(shops.ratingValue), desc(shops.reviewCount))
    .limit(limit)
  return enrichShopsWithCardMeta(rows)
}

// ── State-level aggregate stats ─────────────────────────────────

export interface StateStats {
  shopCount: number
  cityCount: number
  avgRating: number | null
  totalReviews: number
}

export async function getStateStats(state: string): Promise<StateStats> {
  const statePattern = state.toUpperCase()
  const row = await db
    .select({
      shopCount: sql<number>`count(*)::int`,
      cityCount: sql<number>`count(distinct ${shops.city})::int`,
      avgRating: sql<number>`round(avg(${shops.ratingValue})::numeric, 1)`,
      totalReviews: sql<number>`coalesce(sum(${shops.reviewCount}), 0)::int`,
    })
    .from(shops)
    .where(eq(shops.state, statePattern))
    .then((r) => r[0])
  return {
    shopCount: row?.shopCount ?? 0,
    cityCount: row?.cityCount ?? 0,
    avgRating: row?.avgRating ? Number(row.avgRating) : null,
    totalReviews: row?.totalReviews ?? 0,
  }
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

// State nicknames / taglines for directory headers.
const STATE_TAGLINES: Record<string, string> = {
  AL: "Heart of Dixie, Hard-To-Find Hits",
  AK: "The Last Frontier of Card Collecting",
  AZ: "Desert Heat, Hot Pulls",
  AR: "The Natural State, Natural Pulls",
  CA: "Golden State, Golden Pulls",
  CO: "Centennial State, Centennial Slabs",
  CT: "Constitution State, Condition Kings",
  DE: "The First State, First Editions",
  FL: "Sunshine State, Shine Pulls",
  GA: "Peach State, Premium Pulls",
  HI: "Aloha State, Alt-Art Aloha",
  ID: "Gem State, Gem Mint",
  IL: "Land of Lincoln, Land of Legends",
  IN: "Hoosier State, Hobby Heroes",
  IA: "Hawkeye State, Hunted Hits",
  KS: "Sunflower State, Sealed Stacks",
  KY: "Bluegrass State, Box Breaks",
  LA: "Pelican State, Premium Wax",
  ME: "Pine Tree State, Pristine Packs",
  MD: "Old Line State, Old-School Wax",
  MA: "Bay State, Big Pulls",
  MI: "Great Lakes, Great Slabs",
  MN: "North Star State, Near-Mint Stars",
  MS: "Magnolia State, Mint Magnolias",
  MO: "Show-Me State, Show-Me Slabs",
  MT: "Treasure State, Treasure Pulls",
  NE: "Cornhusker State, Collector Corners",
  NV: "Silver State, Silver Slabs",
  NH: "Granite State, Graded Gems",
  NJ: "Garden State, Grail Cards",
  NM: "Land of Enchantment, Enchanted Pulls",
  NY: "Empire State, Empire Hits",
  NC: "Tar Heel State, Top-Tier TCG",
  ND: "Flickertail State, Fresh Packs",
  OH: "Buckeye State, Box-Break Bucks",
  OK: "Sooner State, Sooner Slabs",
  OR: "Beaver State, Binder Builders",
  PA: "Keystone State, Keystone Cards",
  RI: "Ocean State, Open Packs",
  SC: "Palmetto State, Premium Pulls",
  SD: "Mount Rushmore State, Mount Mint",
  TN: "Volunteer State, Vintage Vaults",
  TX: "Lone Star State, Legend Pulls",
  UT: "Beehive State, Binder Hives",
  VT: "Green Mountain State, Graded Mountains",
  VA: "Old Dominion, Dominion Drafts",
  WA: "Evergreen State, Eternal Pulls",
  WV: "Mountain State, Mint Mountains",
  WI: "Badger State, Binder Badgers",
  WY: "Equality State, Equal-Grade Slabs",
  DC: "The District, Draft Nights",
}

export function stateTagline(stateCode: string): string {
  return (
    STATE_TAGLINES[stateCode?.toUpperCase()] || "Local Card Shops, Local Pulls"
  )
}

/**
 * Templated state intro paragraph using the state name + top cities.
 * Falls back gracefully when cities are unavailable.
 */
export function stateIntro(
  stateCode: string,
  topCities: string[] = []
): string {
  const name = stateName(stateCode)
  const tagline = stateTagline(stateCode)
  const cityList = topCities.slice(0, 3)
  const cityPhrase =
    cityList.length > 0
      ? ` Major hubs include ${cityList.join(", ")}${
          cityList.length === 1 ? "" : cityList.length === 2 ? " and" : ", and"
        } their surrounding suburbs, each with its own mix of TCG specialty stores, sports card vaults, and comic shops.`
      : ""
  return `${name}'s trading card scene spans Pokémon leagues, Magic: The Gathering tournaments, Yu-Gi-Oh! events, and a deep sports card culture. ${tagline.replace(/,.*/, "")} collectors will find everything from the latest sealed product and singles to vintage wax, PSA grading drop-offs, and Japanese imports.${cityPhrase} Whether you're chasing a rookie rookie card, hunting alt-art Pokémon, or building your first Commander deck, ${name}'s card shops deliver knowledgeable staff, fair pricing, and a welcoming community for collectors at every level.`
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
