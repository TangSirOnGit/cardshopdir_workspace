export const NEARBY_RADII = [5, 10, 20, 50] as const
export type NearbyRadius = (typeof NEARBY_RADII)[number]
export const DEFAULT_NEARBY_RADIUS: NearbyRadius = 10

const EARTH_RADIUS_MILES = 3958.8

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Latitude/longitude box that fully contains a circle of `radiusMiles`. */
export function boundingBox(lat: number, lng: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69
  const lngDelta =
    radiusMiles / (69 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01))
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  }
}

export type NearbyParams = { lat: number; lng: number; radius: NearbyRadius }

export const MAX_NEARBY_LIMIT = 24

export function parseLimit(raw: string | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= MAX_NEARBY_LIMIT
    ? n
    : MAX_NEARBY_LIMIT
}

/** Round to a ~7 mile grid so approximate (IP) lookups share one cache entry. */
export function gridCoord(v: number): number {
  return Math.round(v * 10) / 10
}

/** Validate raw query values. Coordinates are rounded to ~100 m. */
export function parseNearbyParams(input: {
  lat: string | null
  lng: string | null
  radius: string | null
}): NearbyParams | null {
  if (!input.lat || !input.lng) return null
  const lat = Number(input.lat)
  const lng = Number(input.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  const radius = input.radius ? Number(input.radius) : DEFAULT_NEARBY_RADIUS
  if (!(NEARBY_RADII as readonly number[]).includes(radius)) return null
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000,
    radius: radius as NearbyRadius,
  }
}

export type IpLocation = {
  lat: number
  lng: number
  city: string | null
  region: string | null
  country: string | null
}

/**
 * Approximate visitor location from Cloudflare's "Add visitor location
 * headers" managed transform. Returns null when the headers are absent.
 */
export function ipLocationFromHeaders(headers: Headers): IpLocation | null {
  const lat = Number(headers.get("cf-iplatitude"))
  const lng = Number(headers.get("cf-iplongitude"))
  if (!headers.get("cf-iplatitude") || !headers.get("cf-iplongitude"))
    return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  const decode = (v: string | null) => {
    if (!v) return null
    try {
      return decodeURIComponent(v).slice(0, 80)
    } catch {
      return null
    }
  }
  return {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
    city: decode(headers.get("cf-ipcity")),
    region:
      decode(headers.get("cf-region-code")) ?? decode(headers.get("cf-region")),
    country: decode(headers.get("cf-ipcountry")),
  }
}
