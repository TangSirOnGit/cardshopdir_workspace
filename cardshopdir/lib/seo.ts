const MAX_TITLE = 75

export function shopSeoTitle(name: string, city?: string | null, state?: string | null): string {
  const loc = [city, state].filter(Boolean).join(", ")
  const where = loc ? ` in ${loc}` : ""
  const candidates = [
    `${name} – Card & Hobby Shop${where} | Hours, Games, Address`,
    `${name} – Card Shop${where} | Hours, Games, Address`,
    `${name} – Card Shop${where} | Hours & Address`,
    `${name}${loc ? ` – ${loc}` : ""} | Card Shop Hours & Address`,
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
