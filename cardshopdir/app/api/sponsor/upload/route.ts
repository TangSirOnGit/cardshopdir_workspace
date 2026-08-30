import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { uploadToR2 } from "@/lib/r2"
import { rateLimit } from "@/lib/rate-limit"
import {
  LOGO_SIZE,
  optimizeUploadedImage,
  UnsupportedImageError,
} from "@/lib/images"

const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request: NextRequest) {
  // Booking a sponsor slot requires an account, so uploading its logo does
  // too. Without this, the route was an unauthenticated write into R2.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Keyed on the account alone. Folding the spoofable IP into the key would
  // let one account mint a fresh 10/hour bucket per request.
  const { allowed } = await rateLimit({
    key: `sponsor-upload:${session.user.id}`,
    limit: 10,
    windowSeconds: 3600,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 },
    )
  }

  // Reject oversized bodies *before* formData() buffers them. Route handlers
  // have no default body limit, so checking file.size afterwards means the
  // whole payload is already in memory. A chunked body carries no
  // Content-Length and would skip the check, so a missing header is refused
  // too — browsers always set it for a FormData upload.
  const declaredLength = request.headers.get("content-length")
  if (declaredLength === null || Number(declaredLength) > MAX_SIZE * 2) {
    return NextResponse.json({ error: "File must be under 2MB" }, { status: 413 })
  }

  let file: File | null
  try {
    const formData = await request.formData()
    file = formData.get("file") as File | null
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 2MB" }, { status: 400 })
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())

  let optimized: Buffer
  try {
    optimized = await optimizeUploadedImage(rawBuffer, {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      fit: "inside",
    })
  } catch (err) {
    const message =
      err instanceof UnsupportedImageError
        ? err.message
        : "Could not read that image"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const key = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
  try {
    const url = await uploadToR2(key, optimized, "image/webp")
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[sponsor-upload]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 502 })
  }
}
