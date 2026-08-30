import { describe, expect, test } from "bun:test"
import { normalizeUrl } from "../normalize-url"

describe("normalizeUrl", () => {
  test("strips www, trailing slash and fragment", () => {
    expect(normalizeUrl("https://www.example.com/")).toBe("https://example.com")
    expect(normalizeUrl("https://example.com/path/#section")).toBe(
      "https://example.com/path",
    )
  })

  test("drops tracking params and sorts the rest", () => {
    expect(
      normalizeUrl("https://example.com/?utm_source=x&b=2&fbclid=y&a=1"),
    ).toBe("https://example.com/?a=1&b=2")
  })

  test("lowercases so dedup compares like for like", () => {
    expect(normalizeUrl("HTTPS://Example.COM/Path")).toBe(
      "https://example.com/path",
    )
  })

  test("collapses the www and non-www forms of the same site", () => {
    expect(normalizeUrl("https://www.example.com/x")).toBe(
      normalizeUrl("https://example.com/x"),
    )
  })

  test("keeps a non-default port", () => {
    expect(normalizeUrl("https://example.com:8443/x")).toBe(
      "https://example.com:8443/x",
    )
  })

  // A javascript: URL used to be canonicalised and stored, then rendered as an
  // href. It must never come back out looking like a usable URL.
  test("refuses to canonicalise non-http schemes", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBe("javascript:alert(1)")
    expect(normalizeUrl("data:text/html,<script>")).not.toStartWith("data://")
  })

  test("falls back to a trimmed lowercase string on unparseable input", () => {
    expect(normalizeUrl("  NOT A URL  ")).toBe("not a url")
  })
})
