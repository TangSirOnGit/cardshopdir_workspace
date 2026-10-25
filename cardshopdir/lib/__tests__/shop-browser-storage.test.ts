import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  addRecentShop,
  FAVORITES_KEY,
  MAX_RECENT_SHOPS,
  readBrowserShops,
  RECENT_SHOPS_KEY,
  toggleFavorite,
  type BrowserShop,
} from "../shop-browser-storage"

const values = new Map<string, string>()
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
  clear: () => values.clear(),
  key: () => null,
  get length() {
    return values.size
  },
} as Storage

const testWindow = {
  localStorage: storage,
  dispatchEvent: () => true,
} as unknown as Window & typeof globalThis

const originalWindow = globalThis.window as Window & typeof globalThis

function shop(index: number): BrowserShop {
  return {
    id: index,
    slug: `shop-${index}`,
    name: `Shop ${index}`,
    city: "City",
    state: "CA",
    street: null,
    telephone: null,
    imageUrl: null,
    ratingValue: null,
    reviewCount: null,
    shopType: "tcg_specialty",
    description: null,
  }
}

describe("shop browser storage", () => {
  beforeEach(() => {
    values.clear()
    globalThis.window = testWindow
  })

  afterEach(() => {
    globalThis.window = originalWindow
  })

  test("adds and removes favorites by shop slug", () => {
    expect(toggleFavorite(shop(1))).toBe(true)
    expect(readBrowserShops(FAVORITES_KEY).map((item) => item.slug)).toEqual([
      "shop-1",
    ])

    expect(toggleFavorite(shop(1))).toBe(false)
    expect(readBrowserShops(FAVORITES_KEY)).toEqual([])
  })

  test("moves a revisited shop to the front without duplicating it", () => {
    addRecentShop(shop(1))
    addRecentShop(shop(2))
    addRecentShop(shop(1))

    expect(readBrowserShops(RECENT_SHOPS_KEY).map((item) => item.slug)).toEqual(
      ["shop-1", "shop-2"]
    )
  })

  test("caps recently viewed shops", () => {
    for (let i = 0; i < MAX_RECENT_SHOPS + 3; i++) addRecentShop(shop(i))

    const recent = readBrowserShops(RECENT_SHOPS_KEY)
    expect(recent).toHaveLength(MAX_RECENT_SHOPS)
    expect(recent[0].slug).toBe(`shop-${MAX_RECENT_SHOPS + 2}`)
  })

  test("ignores malformed stored values", () => {
    values.set(FAVORITES_KEY, "{bad json")
    expect(readBrowserShops(FAVORITES_KEY)).toEqual([])

    values.set(FAVORITES_KEY, JSON.stringify([{ slug: 123, name: "Invalid" }]))
    expect(readBrowserShops(FAVORITES_KEY)).toEqual([])
  })
})
