import { describe, expect, test } from "bun:test"
import { calculateSponsorPrice } from "../sponsor-pricing"

const config = {
  basePriceCents: 10_000,
  maxDiscount: 0.3,
  discountFullDays: 7,
  maxDays: 30,
}

describe("calculateSponsorPrice", () => {
  test("charges full price for a single day", () => {
    const p = calculateSponsorPrice(1, config)
    expect(p.discountPercent).toBe(0)
    expect(p.pricePerDay).toBe(10_000)
    expect(p.totalCents).toBe(10_000)
    expect(p.savedCents).toBe(0)
  })

  test("applies the full discount at the threshold and beyond", () => {
    expect(calculateSponsorPrice(7, config).discountPercent).toBe(0.3)
    expect(calculateSponsorPrice(30, config).discountPercent).toBe(0.3)
  })

  test("scales the discount linearly below the threshold", () => {
    const p = calculateSponsorPrice(4, config)
    expect(p.discountPercent).toBeCloseTo(0.15, 10)
    expect(p.pricePerDay).toBe(8_500)
    expect(p.totalCents).toBe(34_000)
    expect(p.savedCents).toBe(6_000)
  })

  test("never returns a total above full price", () => {
    for (let d = 1; d <= config.maxDays; d++) {
      const p = calculateSponsorPrice(d, config)
      expect(p.totalCents).toBeLessThanOrEqual(p.fullPriceCents)
      expect(p.savedCents).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(p.totalCents)).toBe(true)
    }
  })

  test("rejects out-of-range durations rather than pricing them", () => {
    expect(() => calculateSponsorPrice(0, config)).toThrow("Minimum 1 day")
    expect(() => calculateSponsorPrice(31, config)).toThrow("Maximum 30 days")
    // NaN reached this function before the checkout route validated its dates.
    expect(() => calculateSponsorPrice(NaN, config)).toThrow()
  })
})
