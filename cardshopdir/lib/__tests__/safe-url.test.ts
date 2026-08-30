import { describe, expect, test } from "bun:test"
import {
  hasAllowedProtocol,
  isPrivateAddress,
  isPublicUrl,
  isOwnUploadUrl,
} from "../safe-url"

describe("hasAllowedProtocol", () => {
  test("accepts http and https", () => {
    expect(hasAllowedProtocol("http://example.com")).toBe(true)
    expect(hasAllowedProtocol("https://example.com")).toBe(true)
  })

  // `new URL()` parses all of these happily, which is how they used to get
  // stored and rendered as an href.
  test("rejects script-bearing and local schemes", () => {
    expect(hasAllowedProtocol("javascript:alert(1)")).toBe(false)
    expect(hasAllowedProtocol("data:text/html,<script>alert(1)</script>")).toBe(false)
    expect(hasAllowedProtocol("file:///etc/passwd")).toBe(false)
  })

  test("rejects unparseable input", () => {
    expect(hasAllowedProtocol("not a url")).toBe(false)
    expect(hasAllowedProtocol("")).toBe(false)
  })
})

describe("isPrivateAddress", () => {
  test("blocks the cloud metadata endpoint", () => {
    expect(isPrivateAddress("169.254.169.254")).toBe(true)
  })

  test("blocks loopback and RFC1918 ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "10.0.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "0.0.0.0",
      "100.64.0.1", // CGNAT
    ]) {
      expect(isPrivateAddress(ip)).toBe(true)
    }
  })

  test("blocks IPv6 loopback, link-local and unique-local", () => {
    expect(isPrivateAddress("::1")).toBe(true)
    expect(isPrivateAddress("fe80::1")).toBe(true)
    expect(isPrivateAddress("fd00::1")).toBe(true)
  })

  // `new URL()` rewrites ::ffff:169.254.169.254 to ::ffff:a9fe:a9fe, so a
  // check that only sees the dotted form lets the metadata endpoint through.
  // Both spellings must be covered, and the isPublicUrl cases below go through
  // real URL parsing rather than calling this directly.
  test("blocks IPv4-mapped IPv6 in both dotted and hex form", () => {
    expect(isPrivateAddress("::ffff:169.254.169.254")).toBe(true)
    expect(isPrivateAddress("::ffff:a9fe:a9fe")).toBe(true)
    expect(isPrivateAddress("::ffff:7f00:1")).toBe(true)
    expect(isPrivateAddress("::ffff:c0a8:a")).toBe(true)
    expect(isPrivateAddress("::ffff:0a00:1")).toBe(true)
  })

  test("blocks IPv4 embedded in 6to4 and NAT64 addresses", () => {
    expect(isPrivateAddress("2002:a9fe:a9fe::1")).toBe(true) // 6to4 → 169.254.169.254
    expect(isPrivateAddress("2002:7f00:1::1")).toBe(true) // 6to4 → 127.0.0.1
    expect(isPrivateAddress("64:ff9b::a9fe:a9fe")).toBe(true) // NAT64 → 169.254.169.254
    expect(isPrivateAddress("2002:0808:0808::1")).toBe(false) // 6to4 → 8.8.8.8
  })

  test("still allows a public IPv4-mapped address", () => {
    expect(isPrivateAddress("::ffff:8.8.8.8")).toBe(false)
    expect(isPrivateAddress("::ffff:0808:0808")).toBe(false)
  })

  test("allows genuine public addresses", () => {
    expect(isPrivateAddress("8.8.8.8")).toBe(false)
    expect(isPrivateAddress("1.1.1.1")).toBe(false)
    expect(isPrivateAddress("172.32.0.1")).toBe(false) // just past RFC1918
    expect(isPrivateAddress("2606:4700::1111")).toBe(false)
  })

  test("treats anything that is not an IP as unsafe", () => {
    expect(isPrivateAddress("example.com")).toBe(true)
    expect(isPrivateAddress("")).toBe(true)
  })
})

describe("isPublicUrl", () => {
  test("rejects literal internal targets without touching DNS", async () => {
    expect(await isPublicUrl("http://169.254.169.254/latest/meta-data/")).toBe(false)
    expect(await isPublicUrl("http://127.0.0.1:6379")).toBe(false)
    expect(await isPublicUrl("http://[::1]:5432")).toBe(false)
    expect(await isPublicUrl("http://192.168.0.10/admin")).toBe(false)
  })

  // These go through `new URL()`, which normalises the address — the form the
  // guard actually receives at runtime, not the form a caller types.
  test("rejects IPv4-mapped IPv6 targets after URL normalisation", async () => {
    expect(await isPublicUrl("http://[::ffff:169.254.169.254]/latest/meta-data/")).toBe(false)
    expect(await isPublicUrl("http://[::ffff:127.0.0.1]:6379")).toBe(false)
    expect(await isPublicUrl("http://[::ffff:192.168.0.10]/admin")).toBe(false)
    expect(await isPublicUrl("http://[::ffff:10.0.0.1]")).toBe(false)
  })

  test("rejects link-local and unique-local IPv6", async () => {
    expect(await isPublicUrl("http://[fe80::1]")).toBe(false)
    expect(await isPublicUrl("http://[fd00::1]")).toBe(false)
    expect(await isPublicUrl("http://[fc00::1]")).toBe(false)
  })

  test("rejects non-http protocols", async () => {
    expect(await isPublicUrl("file:///etc/passwd")).toBe(false)
    expect(await isPublicUrl("gopher://127.0.0.1")).toBe(false)
  })

  test("rejects hostnames that do not resolve", async () => {
    expect(await isPublicUrl("http://this-host-does-not-exist.invalid")).toBe(false)
  })

  test("allows a public IP literal", async () => {
    expect(await isPublicUrl("https://1.1.1.1")).toBe(true)
  })
})

describe("isOwnUploadUrl", () => {
  const R2 = process.env.R2_PUBLIC_URL
  const CDN = process.env.NEXT_PUBLIC_CDN_HOSTNAME

  test("accepts the local /uploads fallback", () => {
    expect(isOwnUploadUrl("/uploads/thumbnails/a.webp")).toBe(true)
  })

  test("accepts either the R2 origin or the CDN host", () => {
    process.env.R2_PUBLIC_URL = "https://bucket.r2.example.com"
    process.env.NEXT_PUBLIC_CDN_HOSTNAME = "cdn.example.com"
    try {
      // The two are configured separately and are routinely different hosts —
      // matching only one would reject legitimate uploads.
      expect(isOwnUploadUrl("https://bucket.r2.example.com/thumbnails/a.webp")).toBe(true)
      expect(isOwnUploadUrl("https://cdn.example.com/thumbnails/a.webp")).toBe(true)
      expect(isOwnUploadUrl("https://evil.example.com/a.webp")).toBe(false)
    } finally {
      if (R2 === undefined) delete process.env.R2_PUBLIC_URL
      else process.env.R2_PUBLIC_URL = R2
      if (CDN === undefined) delete process.env.NEXT_PUBLIC_CDN_HOSTNAME
      else process.env.NEXT_PUBLIC_CDN_HOSTNAME = CDN
    }
  })
})
