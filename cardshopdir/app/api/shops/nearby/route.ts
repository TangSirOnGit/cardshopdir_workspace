import { NextResponse } from "next/server"
import {
  gridCoord,
  ipLocationFromHeaders,
  parseLimit,
  parseNearbyParams,
} from "@/lib/geo"
import { getShopsNearCoordinates, type NearbyShop } from "@/lib/directory"
import { getRedis } from "@/lib/redis"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"

export const dynamic = "force-dynamic"

const headers = { "Cache-Control": "private, no-store" }
const CACHE_TTL_SECONDS = 3600

/** Local dev only: NEARBY_DEV_LOCATION="41.88,-87.63" simulates the Cloudflare headers. */
function devLocation() {
  const raw =
    process.env.NODE_ENV !== "production" && process.env.NEARBY_DEV_LOCATION
  if (!raw) return null
  const [lat, lng] = raw.split(",").map(Number)
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng, city: "Dev location", region: null, country: null }
    : null
}

/** Approximate-location results are shared per grid cell; precise ones never are. */
async function cachedNearby(
  params: { lat: number; lng: number; radius: 5 | 10 | 20 | 50 },
  limit: number
): Promise<NearbyShop[]> {
  const grid = {
    ...params,
    lat: gridCoord(params.lat),
    lng: gridCoord(params.lng),
  }
  const key = `nearby:v1:${grid.lat}:${grid.lng}:${grid.radius}:${limit}`
  const redis = getRedis()
  try {
    const hit = await redis?.get(key)
    if (hit) return JSON.parse(hit) as NearbyShop[]
  } catch {}
  const shops = await getShopsNearCoordinates(grid, limit)
  try {
    await redis?.set(key, JSON.stringify(shops), "EX", CACHE_TTL_SECONDS)
  } catch {}
  return shops
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers)
  const limited = await rateLimit({
    key: `nearby:${ip}`,
    limit: 30,
    windowSeconds: 60,
  })
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(limited.resetIn) },
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = parseLimit(searchParams.get("limit"))

  if (!searchParams.has("lat") && !searchParams.has("lng")) {
    const loc = ipLocationFromHeaders(request.headers) ?? devLocation()
    const params = loc
      ? parseNearbyParams({
          lat: String(loc.lat),
          lng: String(loc.lng),
          radius: searchParams.get("radius"),
        })
      : null
    if (!loc || !params) {
      return NextResponse.json({ located: false, shops: [] }, { headers })
    }
    const shops = await cachedNearby(params, limit)
    return NextResponse.json(
      {
        located: true,
        approximate: true,
        place: [loc.city, loc.region].filter(Boolean).join(", ") || null,
        radius: params.radius,
        shops,
      },
      { headers }
    )
  }

  const params = parseNearbyParams({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    radius: searchParams.get("radius"),
  })
  if (!params) {
    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400, headers }
    )
  }

  const shops = await getShopsNearCoordinates(params, limit)
  return NextResponse.json({ radius: params.radius, shops }, { headers })
}
