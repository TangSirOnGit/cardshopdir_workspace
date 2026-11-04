import { describe, expect, it } from "bun:test"
import {
  citySeoTitle,
  shopFaqItems,
  shopHoursText,
  shopQuickFacts,
  shopSeoDescription,
  shopSeoTitle,
} from "../seo"

describe("seo titles", () => {
  it("uses the full shop template when it fits", () => {
    expect(shopSeoTitle("Card Forge", "Rome", "NY")).toBe(
      "Card Forge – Card & Hobby Shop in Rome, NY | Hours, Reviews, Address"
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

  it("includes reviews in every shop title variant", () => {
    expect(shopSeoTitle("A Very Long Card Shop Name That Keeps Going On", "Rogersville", "AL")).toContain("Reviews")
  })
})

const base = {
  name: "Card Forge",
  typeLabel: "TCG Specialty Store",
  street: "1 Main St",
  city: "Rome",
  stateFull: "New York",
  postalCode: "13440",
  telephone: "555-1234",
  ratingValue: "4.8",
  reviewCount: 12,
  games: ["Pokémon", "Magic: The Gathering"],
  hours: [
    { days: ["Monday", "Tuesday"], opens: "10:00", closes: "18:00" },
    { days: ["Sunday"], opens: null, closes: null },
  ],
}

describe("shop facts", () => {
  it("formats hours", () => {
    expect(shopHoursText(base.hours)).toBe("Mon, Tue: 10AM–6PM; Sun: Closed")
  })
  it("builds description with rating", () => {
    const d = shopSeoDescription(base)
    expect(d).toContain("Rated 4.8/5 from 12 reviews.")
    expect(d).toContain("Pokémon, Magic: The Gathering")
  })
  it("keeps acronyms uppercase in the type noun", () => {
    expect(shopSeoDescription(base)).toContain("is a TCG specialty store in")
  })
  it("omits rating when missing", () => {
    expect(shopSeoDescription({ ...base, ratingValue: null })).not.toContain("Rated")
  })
  it("shortens the closing sentence for long descriptions", () => {
    expect(shopSeoDescription({ ...base, name: "A".repeat(60) })).toEndWith("See hours and directions.")
  })
  it("builds quick facts", () => {
    expect(shopQuickFacts(base)).toContain("1 Main St, Rome, New York 13440")
  })
  it("only emits FAQ items backed by data", () => {
    expect(shopFaqItems(base)).toHaveLength(4)
    const q = shopFaqItems({ ...base, hours: [], games: [], telephone: null, street: null, city: null, stateFull: null, postalCode: null })
    expect(q).toHaveLength(0)
  })
})
