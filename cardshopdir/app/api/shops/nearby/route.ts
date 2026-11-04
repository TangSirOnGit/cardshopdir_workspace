import { NextResponse } from "next/server"
import { parseNearbyParams } from "@/lib/geo"
import { getShopsNearCoordinates } from "@/lib/directory"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"

export const dynamic = "force-dynamic"

const headers = { "Cache-Control": "private, no-store" }

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
