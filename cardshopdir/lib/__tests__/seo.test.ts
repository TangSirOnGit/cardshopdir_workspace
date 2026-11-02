import { describe, expect, it } from "bun:test"
import { citySeoTitle, shopSeoTitle } from "../seo"

describe("seo titles", () => {
  it("uses the full shop template when it fits", () => {
    expect(shopSeoTitle("Card Forge", "Rome", "NY")).toBe(
      "Card Forge – Card & Hobby Shop in Rome, NY | Hours, Games, Address"
    )
  })
  it("shortens long shop titles", () => {
    expect(shopSeoTitle("The Upper Deck Cards & Comics", "Rogersville", "AL").length).toBeLessThanOrEqual(75)
  })
  it("builds the city title", () => {
    expect(citySeoTitle(12, "Austin", "TX", 2026)).toBe(
      "12 Card Shops in Austin, TX (Pokémon, MTG, Sports Cards) – Updated 2026"
    )
    expect(citySeoTitle(1, "X", "TX", 2026)).toContain("1 Card Shop in")
  })
})
