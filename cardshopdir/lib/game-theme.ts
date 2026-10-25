export interface GameTheme {
  emoji: string
  label: string
  hue: number
}

export const GAME_THEMES: Record<string, GameTheme> = {
  pokemon: { emoji: "⚡", label: "Pokémon", hue: 90 },
  "magic-the-gathering": { emoji: "🪄", label: "MTG", hue: 55 },
  "yu-gi-oh": { emoji: "🎴", label: "Yu-Gi-Oh!", hue: 305 },
  "flesh-and-blood": { emoji: "⚔️", label: "Flesh & Blood", hue: 25 },
  sports: { emoji: "⚾", label: "Sports", hue: 150 },
  lorcana: { emoji: "✨", label: "Lorcana", hue: 270 },
  "dragon-ball-super": { emoji: "🐉", label: "DBS", hue: 45 },
  "star-wars-unlimited": { emoji: "🚀", label: "Star Wars", hue: 235 },
  "one-piece": { emoji: "🏴‍☠️", label: "One Piece", hue: 10 },
  "union-arena": { emoji: "🥊", label: "Union Arena", hue: 200 },
  digimon: { emoji: "🤖", label: "Digimon", hue: 215 },
  "final-fantasy": { emoji: "🗡️", label: "Final Fantasy", hue: 250 },
  "weiss-schwarz": { emoji: "🌸", label: "Weiss Schwarz", hue: 350 },
  "cardfight-vanguard": { emoji: "🛡️", label: "Vanguard", hue: 225 },
  riftbound: { emoji: "🌀", label: "Riftbound", hue: 195 },
}

export function gameTheme(slug: string, displayName: string): GameTheme {
  return GAME_THEMES[slug] || { emoji: "🃏", label: displayName, hue: 260 }
}
