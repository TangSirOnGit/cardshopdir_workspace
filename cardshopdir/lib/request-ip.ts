import "server-only"

/**
 * Resolve the client IP used as a rate-limiting key.
 *
 * These headers are only trustworthy when a proxy in front of the app
 * overwrites them — Vercel, Netlify and Cloudflare all do. An app exposed
 * directly to the internet lets a caller set `x-forwarded-for` freely, and
 * per-IP limits stop meaning anything.
 *
 * There is no safe fallback for that case: keying everyone to one bucket would
 * let a handful of requests lock every legitimate user out. Run behind a proxy.
 */
export function getClientIp(headers: Headers): string {
  // `x-forwarded-for` first, deliberately. `cf-connecting-ip` is only set by
  // Cloudflare; anywhere else it passes straight through from the caller, so
  // preferring it hands an attacker a fresh bucket per request.
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}
