import type { ShopListItem } from "@/lib/shop-types"

export type NearbyShop = ShopListItem & { distanceMiles: number }
export type NearbySource =
  { kind: "ip" } | { kind: "gps"; lat: number; lng: number }
export type NearbyData = {
  located?: boolean
  place?: string | null
  shops: NearbyShop[]
}

export async function fetchNearby(
  src: NearbySource,
  radius: number,
  limit?: number
): Promise<NearbyData | null> {
  const qs = new URLSearchParams({ radius: String(radius) })
  if (src.kind === "gps") {
    qs.set("lat", String(src.lat))
    qs.set("lng", String(src.lng))
  }
  if (limit) qs.set("limit", String(limit))
  try {
    const res = await fetch(`/api/shops/nearby?${qs}`)
    return res.ok ? ((await res.json()) as NearbyData) : null
  } catch {
    return null
  }
}
