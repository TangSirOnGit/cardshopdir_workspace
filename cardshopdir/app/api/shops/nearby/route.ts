import { NextResponse } from "next/server"
import { ipLocationFromHeaders, parseNearbyParams } from "@/lib/geo"
import { getShopsNearCoordinates } from "@/lib/directory"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"

export const dynamic = "force-dynamic"

const headers = { "Cache-Control": "private, no-store" }

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
    const shops = await getShopsNearCoordinates(params)
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

  const shops = await getShopsNearCoordinates(params)
  return NextResponse.json({ radius: params.radius, shops }, { headers })
}
