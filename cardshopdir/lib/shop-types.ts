/**
 * Shared shop types and display helpers.
 * This file has NO server-only imports (no db) so it can be safely
 * imported from both server and client components.
 */

export interface ShopListItem {
  id: number
  slug: string
  name: string
  city: string | null
  state: string | null
  imageUrl: string | null
  ratingValue: string | null
  reviewCount: number | null
  shopType: string
  description: string | null
}

const SHOP_TYPE_LABELS: Record<string, string> = {
  tcg_specialty: "TCG Specialty Store",
  comic_shop: "Comic & Game Shop",
  game_store: "Game Store",
  hobby_shop: "Hobby Shop",
  collectibles: "Collectibles Store",
  retail: "Retail Store",
  online: "Online Retailer",
  other: "Shop",
}

export function shopTypeLabel(type: string | null | undefined): string {
  if (!type) return "Shop"
  return SHOP_TYPE_LABELS[type] || "Shop"
}
