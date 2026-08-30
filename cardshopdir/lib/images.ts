import { uploadToR2 } from "@/lib/r2"
import { fetchPublicUrl } from "@/lib/safe-url"
import sharp from "sharp"

export const LOGO_SIZE = 256
export const WEBP_QUALITY = 80
export const REMOTE_FETCH_TIMEOUT_MS = 10_000
export const REMOTE_MAX_BYTES = 5 * 1024 * 1024
export const REMOTE_MIN_BYTES = 100

export function getLogoUrl(logoUrl?: string | null): string | null {
  return logoUrl || null
}

/** True when `url` points to our own CDN/R2 bucket or a local `/uploads/`
 * path — i.e., safe to pass to `next/image` without tripping an un-allowed
 * hostname. */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.startsWith("/uploads/")) return true
  try {
    const host = new URL(url).hostname
    const cdn = process.env.NEXT_PUBLIC_CDN_HOSTNAME
    return !!cdn && host === cdn
  } catch {
    return false
  }
}

/** Fetch a remote image, re-encode to webp at LOGO_SIZE, upload to R2.
 * Returns the CDN URL or null when anything fails. */
export async function uploadRemoteImageToR2(
  url: string,
  keyPrefix = "images",
): Promise<string | null> {
  // `url` comes from the user. fetchPublicUrl rejects loopback, private and
  // link-local targets, re-checks every redirect hop, and caps the body.
  const fetched = await fetchPublicUrl(url, {
    timeoutMs: REMOTE_FETCH_TIMEOUT_MS,
    maxBytes: REMOTE_MAX_BYTES,
  })
  if (!fetched) return null

  const { buffer, contentType } = fetched
  if (!contentType.toLowerCase().startsWith("image/")) return null
  if (buffer.byteLength < REMOTE_MIN_BYTES) return null

  let optimized: Buffer
  try {
    optimized = await sharp(buffer)
      .resize(LOGO_SIZE, LOGO_SIZE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer()
  } catch {
    return null
  }

  const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
  try {
    return await uploadToR2(key, optimized, "image/webp")
  } catch {
    return null
  }
}

/** Fetch the Google favicon for a domain, upload to R2, return the CDN URL
 * (or null if no viable source). */
export async function cacheFavicon(
  websiteUrl: string,
  opts: { onError?: (reason: string) => void } = {},
): Promise<string | null> {
  const { onError } = opts
  let domain: string
  let rootDomain: string
  try {
    domain = new URL(websiteUrl).hostname
    const parts = domain.split(".")
    rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : domain
  } catch (e) {
    onError?.(`invalid URL: ${String(e)}`)
    return null
  }

  const origin = new URL(websiteUrl).origin
  const sources: { url: string; minSize: number }[] = [
    { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`, minSize: 64 },
    { url: `https://www.google.com/s2/favicons?domain=${rootDomain}&sz=256`, minSize: 64 },
    { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, minSize: 64 },
    { url: `https://www.google.com/s2/favicons?domain=${rootDomain}&sz=128`, minSize: 64 },
    { url: `${origin}/apple-touch-icon.png`, minSize: 120 },
    { url: `${origin}/apple-touch-icon-precomposed.png`, minSize: 120 },
    { url: `https://icons.duckduckgo.com/ip3/${domain}.ico`, minSize: 32 },
    { url: `https://icons.duckduckgo.com/ip3/${rootDomain}.ico`, minSize: 32 },
  ]

  for (const { url: src, minSize } of sources) {
    try {
      // Two of these sources are built from the user-supplied origin, so every
      // hop goes through the same public-address guard.
      const fetched = await fetchPublicUrl(src, {
        timeoutMs: REMOTE_FETCH_TIMEOUT_MS,
        maxBytes: REMOTE_MAX_BYTES,
      })
      if (!fetched) {
        onError?.(`${src} → unreachable or not a public address`)
        continue
      }
      const { buffer } = fetched
      if (buffer.byteLength < REMOTE_MIN_BYTES) {
        onError?.(`${src} → too small (${buffer.byteLength}B)`)
        continue
      }

      let width = 0
      let height = 0
      try {
        const meta = await sharp(buffer).metadata()
        width = meta.width ?? 0
        height = meta.height ?? 0
      } catch {
        // .ico files may fail sharp metadata — accept on bytes alone
      }

      if (width && width < minSize) {
        onError?.(`${src} → too small (${width}×${height})`)
        continue
      }

      const contentType = fetched.contentType || "image/png"
      const ext = contentType.includes("svg")
        ? "svg"
        : contentType.includes("ico")
          ? "ico"
          : "png"
      const key = `logos/${domain}.${ext}`
      return await uploadToR2(key, buffer, contentType)
    } catch (e) {
      onError?.(`${src} → ${String(e)}`)
    }
  }

  return null
}

/** Image formats accepted on upload, checked against decoded bytes rather than
 * the client-supplied MIME type. */
const ALLOWED_UPLOAD_FORMATS = new Set(["jpeg", "jpg", "png", "webp"])

export class UnsupportedImageError extends Error {
  constructor() {
    super("Only JPG, PNG, and WebP are allowed")
    this.name = "UnsupportedImageError"
  }
}

/**
 * Decode an uploaded image, verify it really is one of the allowed formats,
 * and re-encode it to WebP at the given box.
 *
 * `File.type` is whatever the client put in the multipart header, so the
 * format check has to happen on the decoded bytes. Throws
 * `UnsupportedImageError` for a wrong format and a plain error for anything
 * sharp cannot read.
 */
export async function optimizeUploadedImage(
  raw: Buffer,
  resize: { width: number; height: number; fit: "inside" | "cover" },
): Promise<Buffer> {
  const image = sharp(raw)
  const meta = await image.metadata()

  if (!meta.format || !ALLOWED_UPLOAD_FORMATS.has(meta.format)) {
    throw new UnsupportedImageError()
  }

  return image
    .resize(resize.width, resize.height, {
      fit: resize.fit,
      ...(resize.fit === "cover"
        ? { position: "centre" as const }
        : { withoutEnlargement: true }),
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer()
}
