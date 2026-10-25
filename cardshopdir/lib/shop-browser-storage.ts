import type { ShopListItem } from "@/lib/shop-types"

export type BrowserShop = Pick<
  ShopListItem,
  | "id"
  | "slug"
  | "name"
  | "city"
  | "state"
  | "street"
  | "telephone"
  | "imageUrl"
  | "ratingValue"
  | "reviewCount"
  | "shopType"
  | "description"
  | "games"
  | "todayHours"
  | "isOpenNow"
>

export const FAVORITES_KEY = "cardshopdir:favorites:v1"
export const RECENT_SHOPS_KEY = "cardshopdir:recent-shops:v1"
export const SHOP_STORAGE_EVENT = "cardshopdir:shop-storage"
export const MAX_RECENT_SHOPS = 12

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readBrowserShops(key: string): BrowserShop[] {
  const storage = browserStorage()
  if (!storage) return []
  try {
    const value: unknown = JSON.parse(storage.getItem(key) || "[]")
    if (!Array.isArray(value)) return []
    return value.filter(
      (shop): shop is BrowserShop =>
        Boolean(shop) &&
        typeof shop === "object" &&
        typeof shop.slug === "string" &&
        typeof shop.name === "string"
    )
  } catch {
    return []
  }
}

function writeBrowserShops(key: string, shops: BrowserShop[]) {
  const storage = browserStorage()
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(shops))
    window.dispatchEvent(new Event(SHOP_STORAGE_EVENT))
  } catch {
    // Private browsing or a full storage quota should not break navigation.
  }
}

export function toggleFavorite(shop: BrowserShop): boolean {
  const favorites = readBrowserShops(FAVORITES_KEY)
  const exists = favorites.some((item) => item.slug === shop.slug)
  writeBrowserShops(
    FAVORITES_KEY,
    exists
      ? favorites.filter((item) => item.slug !== shop.slug)
      : [shop, ...favorites]
  )
  return !exists
}

export function addRecentShop(shop: BrowserShop) {
  const recent = readBrowserShops(RECENT_SHOPS_KEY).filter(
    (item) => item.slug !== shop.slug
  )
  writeBrowserShops(
    RECENT_SHOPS_KEY,
    [shop, ...recent].slice(0, MAX_RECENT_SHOPS)
  )
}
