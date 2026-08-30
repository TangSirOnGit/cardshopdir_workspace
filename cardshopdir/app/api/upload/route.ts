import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadToR2 } from "@/lib/r2"
import { headers } from "next/headers"
import { getSettingNumber } from "@/lib/settings"
import { rateLimit } from "@/lib/rate-limit"
import {
  optimizeUploadedImage,
  UnsupportedImageError,
} from "@/lib/images"

const MAX_WIDTH = 1280
const MAX_HEIGHT = 720

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = await rateLimit({
    key: `upload:${session.user.id}`,
    limit: 20,
    windowSeconds: 3600,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 },
    )
  }

  const maxThumbnailSizeMb = await getSettingNumber("max_thumbnail_size_mb")
  const maxThumbnailSize = maxThumbnailSizeMb * 1024 * 1024

  // Reject oversized bodies before formData() buffers the whole thing.
  // A chunked body carries no Content-Length, which would skip this check
  // entirely and buffer unbounded input — so a missing header is refused too.
  // Browsers always set it for a FormData upload.
  const declaredLength = request.headers.get("content-length")
  if (declaredLength === null || Number(declaredLength) > maxThumbnailSize * 2) {
    return NextResponse.json(
      { error: `File must be under ${maxThumbnailSizeMb}MB` },
      { status: 413 },
    )
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

  if (file.size > maxThumbnailSize) {
    return NextResponse.json(
      { error: `File must be under ${maxThumbnailSizeMb}MB` },
      { status: 400 },
    )
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())

  let optimized: Buffer
  try {
    optimized = await optimizeUploadedImage(rawBuffer, {
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "cover",
    })
  } catch (err) {
    const message =
      err instanceof UnsupportedImageError
        ? err.message
        : "Could not read that image"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const key = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
  try {
    const url = await uploadToR2(key, optimized, "image/webp")
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[upload]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 502 })
  }
}
