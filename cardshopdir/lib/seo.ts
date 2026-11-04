const MAX_TITLE = 75

export function shopSeoTitle(name: string, city?: string | null, state?: string | null): string {
  const loc = [city, state].filter(Boolean).join(", ")
  const where = loc ? ` in ${loc}` : ""
  const candidates = [
    `${name} – Card & Hobby Shop${where} | Hours, Reviews, Address`,
    `${name} – Card Shop${where} | Hours, Reviews, Address`,
    `${name} – Card Shop${where} | Hours & Reviews`,
    `${name}${loc ? ` – ${loc}` : ""} | Card Shop Hours & Reviews`,
  ]
  return candidates.find((t) => t.length <= MAX_TITLE) ?? candidates[candidates.length - 1]
}

export function citySeoTitle(count: number, city: string, state: string, year = new Date().getFullYear()): string {
  const n = `${count} Card Shop${count === 1 ? "" : "s"}`
  const candidates = [
    `${n} in ${city}, ${state} (Pokémon, MTG, Sports Cards) – Updated ${year}`,
    `${n} in ${city}, ${state} (Pokémon, MTG & Sports) – ${year}`,
    `${n} in ${city}, ${state} – Updated ${year}`,
  ]
  return candidates.find((t) => t.length <= MAX_TITLE) ?? candidates[candidates.length - 1]
}

export function citySeoDescription(count: number, city: string, state: string, stateFull: string, year = new Date().getFullYear()): string {
  return `Browse ${count} card shop${count === 1 ? "" : "s"} in ${city}, ${stateFull} (${state}) for Pokémon, Magic: The Gathering, Yu-Gi-Oh! and sports cards. Hours, ratings, phone numbers and directions — updated ${year}.`
}

export interface ShopFactsInput {
  name: string
  typeLabel: string
  street?: string | null
  city?: string | null
  stateFull?: string | null
  postalCode?: string | null
  telephone?: string | null
  ratingValue?: string | null
  reviewCount?: number | null
  games: string[]
  hours: { days: unknown; opens: string | null; closes: string | null }[]
}

export function shopSeoDescription(i: ShopFactsInput): string {
  const cityState = [i.city, i.stateFull].filter(Boolean).join(", ")
  const where = cityState ? ` in ${cityState}` : ""
  const games = i.games.slice(0, 4)
  const gamesPhrase = games.length ? ` carrying ${games.join(", ")}` : ""
  const rating =
    i.ratingValue && i.reviewCount
      ? ` Rated ${i.ratingValue}/5 from ${i.reviewCount} review${i.reviewCount === 1 ? "" : "s"}.`
      : ""
  return `${i.name} is a ${i.typeLabel.toLowerCase()}${where}${gamesPhrase}.${rating} See hours, address, directions and the games they carry.`
}

const DAY_ABBR: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
}

function clock(t: string): string {
  const [hStr, mStr] = t.split(":")
  let h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h)) return t
  const ampm = h < 12 ? "AM" : "PM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`
}

export function shopHoursText(hours: ShopFactsInput["hours"]): string {
  return hours
    .filter((h) => Array.isArray(h.days) && h.days.length > 0)
    .map((h) => {
      const days = (h.days as string[]).map((d) => DAY_ABBR[d] ?? d).join(", ")
      return `${days}: ${h.opens && h.closes ? `${clock(h.opens)}–${clock(h.closes)}` : "Closed"}`
    })
    .join("; ")
}

export function shopAddressText(i: Pick<ShopFactsInput, "street" | "city" | "stateFull" | "postalCode">): string {
  const tail = [i.city, [i.stateFull, i.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  return [i.street, tail].filter(Boolean).join(", ")
}

export function shopQuickFacts(i: ShopFactsInput): string {
  const address = shopAddressText(i)
  const parts = [`${i.name} is a ${i.typeLabel.toLowerCase()}${address ? ` located at ${address}` : ""}.`]
  if (i.ratingValue && i.reviewCount) {
    parts.push(`It is rated ${i.ratingValue} out of 5 from ${i.reviewCount} review${i.reviewCount === 1 ? "" : "s"}.`)
  }
  if (i.games.length) parts.push(`The shop carries ${i.games.join(", ")}.`)
  return parts.join(" ")
}

export function shopFaqItems(i: ShopFactsInput): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = []
  const hours = shopHoursText(i.hours)
  if (hours) items.push({ question: `What are the opening hours of ${i.name}?`, answer: `${i.name} is open ${hours}.` })
  const address = shopAddressText(i)
  if (address) items.push({ question: `Where is ${i.name} located?`, answer: `${i.name} is located at ${address}.` })
  if (i.games.length) {
    items.push({
      question: `What games does ${i.name} carry?`,
      answer: `${i.name} carries ${i.games.join(", ")}.`,
    })
  }
  if (i.telephone) items.push({ question: `What is the phone number of ${i.name}?`, answer: `You can call ${i.name} at ${i.telephone}.` })
  return items
}
