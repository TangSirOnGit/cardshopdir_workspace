import { describe, expect, test } from "bun:test"
import { buildShareLinks } from "../share-links"

const url = "https://cardshopdir.com/shop/foo-bar"
const text = "Foo & Bar - trading card shop in Austin, TX"

describe("buildShareLinks", () => {
  const links = Object.fromEntries(
    buildShareLinks(url, text).map((l) => [l.key, l.href])
  )

  test("covers the supported platforms", () => {
    expect(Object.keys(links)).toEqual([
      "x",
      "facebook",
      "reddit",
      "whatsapp",
      "telegram",
      "email",
    ])
  })

  test("encodes the url and text so special characters survive", () => {
    expect(links.x).toContain(`url=${encodeURIComponent(url)}`)
    expect(links.x).toContain(`text=${encodeURIComponent(text)}`)
    expect(links.x).not.toContain("Foo & Bar")
    expect(links.facebook).toContain(`u=${encodeURIComponent(url)}`)
  })

  test("includes the url in text-only channels", () => {
    expect(decodeURIComponent(links.whatsapp)).toContain(url)
    expect(decodeURIComponent(links.email)).toContain(url)
    expect(links.email.startsWith("mailto:")).toBe(true)
  })
})
