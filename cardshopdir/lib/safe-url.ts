import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

/** Protocols we are ever willing to store or fetch. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

/**
 * Accept only `http:` / `https:`. Guards anywhere a user-supplied URL is
 * persisted and later rendered as an `href` — `javascript:` and `data:` parse
 * happily through `new URL()`.
 */
export function hasAllowedProtocol(raw: string): boolean {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(raw).protocol)
  } catch {
    return false
  }
}

/** IPv4 ranges that must never be reachable from a server-side fetch. */
function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number)
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true // unparseable — treat as unsafe
  }
  const [a, b] = p
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) || // link-local (cloud metadata)
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    (a === 192 && b === 0) || // IETF protocol assignments
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast + reserved
  )
}

/**
 * Expand an IPv6 address to its eight 16-bit groups.
 *
 * Returns null when the address cannot be parsed. Handles the `::` run and a
 * trailing dotted-quad (`::ffff:1.2.3.4`).
 */
function expandIPv6(ip: string): number[] | null {
  let addr = ip.toLowerCase().split("%")[0]

  // A trailing dotted-quad occupies the last two groups.
  const dotted = addr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (dotted) {
    const octets = dotted[1].split(".").map(Number)
    if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) return null
    const hi = ((octets[0] << 8) | octets[1]).toString(16)
    const lo = ((octets[2] << 8) | octets[3]).toString(16)
    addr = addr.slice(0, dotted.index) + `${hi}:${lo}`
  }

  const halves = addr.split("::")
  if (halves.length > 2) return null

  const parse = (part: string) =>
    part === "" ? [] : part.split(":").map((g) => parseInt(g, 16))

  let groups: number[]
  if (halves.length === 2) {
    const head = parse(halves[0])
    const tail = parse(halves[1])
    const fill = 8 - head.length - tail.length
    if (fill < 0) return null
    groups = [...head, ...Array(fill).fill(0), ...tail]
  } else {
    groups = parse(halves[0])
  }

  if (groups.length !== 8 || groups.some((g) => !Number.isInteger(g) || g < 0 || g > 0xffff)) {
    return null
  }
  return groups
}

/**
 * IPv6 ranges that must never be reachable from a server-side fetch.
 *
 * Works on the expanded groups rather than the string, because `new URL()`
 * rewrites `::ffff:169.254.169.254` to `::ffff:a9fe:a9fe` — a textual check
 * for the dotted form never sees the metadata endpoint coming.
 */
function isPrivateIPv6(ip: string): boolean {
  const g = expandIPv6(ip)
  if (!g) return true

  if (g.every((x) => x === 0)) return true // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true // ::1

  // IPv4-mapped (::ffff:0:0/96) and IPv4-compatible (::/96): re-check the
  // embedded IPv4 rather than treating the address as opaque.
  const firstFiveZero = g.slice(0, 5).every((x) => x === 0)
  if (firstFiveZero && (g[5] === 0xffff || g[5] === 0)) {
    const embedded = [g[6] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff].join(".")
    return isPrivateIPv4(embedded)
  }

  if ((g[0] & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
  if ((g[0] & 0xfe00) === 0xfc00) return true // fc00::/7 unique-local

  // 6to4 (2002::/16) and NAT64 (64:ff9b::/96) embed an IPv4 address that a
  // relay will happily route to. Only reachable on a network running one, but
  // the check is two comparisons.
  if (g[0] === 0x2002) {
    return isPrivateIPv4([g[1] >> 8, g[1] & 0xff, g[2] >> 8, g[2] & 0xff].join("."))
  }
  if (g[0] === 0x0064 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return isPrivateIPv4([g[6] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff].join("."))
  }

  return false
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isPrivateIPv4(ip)
  if (version === 6) return isPrivateIPv6(ip)
  return true // not an IP at all — treat as unsafe
}

/**
 * Resolve a URL's hostname and reject it when it points at loopback, private,
 * link-local or otherwise internal space.
 *
 * Blocks the classic SSRF targets — `169.254.169.254` (cloud instance
 * metadata), `127.0.0.1`, RFC1918 — including via a hostname that resolves
 * there. Every address the hostname resolves to must be public, so a
 * multi-record DNS rebinding answer cannot slip one through.
 */
export async function isPublicUrl(raw: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return false
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false

  const host = parsed.hostname.replace(/^\[|\]$/g, "")

  if (isIP(host)) return !isPrivateAddress(host)

  try {
    const records = await lookup(host, { all: true, verbatim: true })
    if (records.length === 0) return false
    return records.every((r) => !isPrivateAddress(r.address))
  } catch {
    return false
  }
}

export interface SafeFetchOptions {
  timeoutMs: number
  /** Hard cap on the response body; the stream is aborted past this. */
  maxBytes: number
  /** Redirect hops to follow. Each hop is re-validated. */
  maxRedirects?: number
}

/**
 * `fetch` for URLs a user supplied.
 *
 * Validates the target before every hop (a public URL is free to redirect to
 * `169.254.169.254`, so following redirects automatically would reopen the
 * hole), and reads the body through a byte budget instead of buffering
 * whatever the remote decides to send.
 *
 * Residual risk: the DNS answer is re-resolved by `fetch` itself, so a
 * sub-second rebinding attack remains theoretically possible. Closing that
 * fully requires pinning the connection to the resolved IP, which `undici`
 * does not expose here — the exposure is a blind request with no body
 * returned to the caller.
 */
export async function fetchPublicUrl(
  url: string,
  { timeoutMs, maxBytes, maxRedirects = 3 }: SafeFetchOptions,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  let current = url

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!(await isPublicUrl(current))) return null

    let res: Response
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      return null
    }

    if (res.status >= 300 && res.status < 400) {
      // Release the socket before following the hop.
      await res.body?.cancel().catch(() => {})
      const location = res.headers.get("location")
      if (!location) return null
      try {
        current = new URL(location, current).toString()
      } catch {
        return null
      }
      continue
    }

    if (!res.ok || !res.body) return null

    const declared = res.headers.get("content-length")
    if (declared && Number(declared) > maxBytes) return null

    const chunks: Uint8Array[] = []
    let total = 0
    const reader = res.body.getReader()
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > maxBytes) {
          await reader.cancel()
          return null
        }
        chunks.push(value)
      }
    } catch {
      return null
    }

    return {
      buffer: Buffer.concat(chunks),
      contentType: res.headers.get("content-type") ?? "",
    }
  }

  return null // too many redirects
}

/**
 * True when `url` is something this app itself produced via `uploadToR2` —
 * a local `/uploads/` path, the configured R2 public origin, or the public CDN
 * hostname.
 *
 * Both env vars are checked because they are configured separately and are
 * routinely different hosts (`R2_PUBLIC_URL` is the bucket, the CDN hostname
 * is what `next/image` is allowed to load). Matching only one rejects
 * perfectly legitimate uploads.
 */
export function isOwnUploadUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true

  let host: string
  try {
    const parsed = new URL(url)
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false
    host = parsed.hostname
  } catch {
    return false
  }

  const allowedHosts = new Set<string>()

  const r2Public = process.env.R2_PUBLIC_URL
  if (r2Public) {
    try {
      allowedHosts.add(new URL(r2Public).hostname)
    } catch {
      // Misconfigured R2_PUBLIC_URL — ignore rather than reject everything.
    }
  }

  const cdn = process.env.NEXT_PUBLIC_CDN_HOSTNAME
  if (cdn) allowedHosts.add(cdn)

  // Nothing configured means local dev with the /uploads/ fallback; anything
  // remote is not ours.
  if (allowedHosts.size === 0) return false

  return allowedHosts.has(host)
}
