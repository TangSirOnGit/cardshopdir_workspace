/**
 * Normalize a URL to a canonical form for dedup comparison.
 * - Lowercases protocol + hostname
 * - Strips www.
 * - Strips trailing slash
 * - Strips fragment (#...)
 * - Strips common tracking params (utm_*, ref, source, fbclid, gclid)
 * - Sorts remaining query params
 */
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw)
    // `new URL` happily parses javascript: and data:, and the result is stored
    // then rendered as an href. Only http(s) may get past here.
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return raw.toLowerCase().trim()
    }
    url.hostname = url.hostname.replace(/^www\./, "")

    const tracking = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "source", "fbclid", "gclid"]
    for (const key of tracking) {
      url.searchParams.delete(key)
    }

    url.searchParams.sort()

    url.hash = ""

    let normalized = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}${url.search}`
    normalized = normalized.replace(/\/+$/, "")

    return normalized.toLowerCase()
  } catch {
    return raw.toLowerCase().trim()
  }
}
