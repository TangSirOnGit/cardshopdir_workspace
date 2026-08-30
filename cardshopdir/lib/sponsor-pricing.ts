export interface SponsorPricingConfig {
  basePriceCents: number
  maxDiscount: number
  discountFullDays: number
  maxDays: number
}

export function calculateSponsorPrice(days: number, config: SponsorPricingConfig) {
  // NaN fails every comparison below, so without this guard a malformed date
  // upstream produces a NaN price and Stripe rejects the session.
  if (!Number.isFinite(days)) throw new Error("Invalid duration")
  if (days < 1) throw new Error("Minimum 1 day")
  if (days > config.maxDays)
    throw new Error(`Maximum ${config.maxDays} days`)

  const discountPercent =
    days >= config.discountFullDays
      ? config.maxDiscount
      : ((days - 1) / (config.discountFullDays - 1)) * config.maxDiscount

  const pricePerDay = Math.round(
    config.basePriceCents * (1 - discountPercent),
  )
  const fullPriceCents = config.basePriceCents * days
  const totalCents = pricePerDay * days
  const savedCents = fullPriceCents - totalCents

  return { days, pricePerDay, totalCents, fullPriceCents, savedCents, discountPercent }
}
