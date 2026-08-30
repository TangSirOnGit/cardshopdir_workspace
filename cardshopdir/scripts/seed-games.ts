/**
 * Seed games table with the 15 TCG categories found in our data.
 *
 * Usage: bun run scripts/seed-games.ts
 */
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

const GAME_DATA = [
  { slug: "pokemon", name: "Pokemon", displayName: "Pokemon", sortOrder: 1 },
  { slug: "magic-the-gathering", name: "Magic: The Gathering", displayName: "Magic: The Gathering", sortOrder: 2 },
  { slug: "yu-gi-oh", name: "Yu-Gi-Oh!", displayName: "Yu-Gi-Oh!", sortOrder: 3 },
  { slug: "flesh-and-blood", name: "Flesh and Blood", displayName: "Flesh and Blood", sortOrder: 4 },
  { slug: "riftbound", name: "Riftbound", displayName: "Riftbound", sortOrder: 5 },
  { slug: "sports", name: "Sports Cards", displayName: "Sports Cards", sortOrder: 6 },
  { slug: "lorcana", name: "Lorcana", displayName: "Disney Lorcana", sortOrder: 7 },
  { slug: "dragon-ball-super", name: "Dragon Ball Super", displayName: "Dragon Ball Super", sortOrder: 8 },
  { slug: "star-wars-unlimited", name: "Star Wars Unlimited", displayName: "Star Wars Unlimited", sortOrder: 9 },
  { slug: "one-piece", name: "One Piece", displayName: "One Piece", sortOrder: 10 },
  { slug: "union-arena", name: "Union Arena", displayName: "Union Arena", sortOrder: 11 },
  { slug: "digimon", name: "Digimon", displayName: "Digimon", sortOrder: 12 },
  { slug: "final-fantasy", name: "Final Fantasy", displayName: "Final Fantasy TCG", sortOrder: 13 },
  { slug: "weiss-schwarz", name: "Weiss Schwarz", displayName: "Weiss Schwarz", sortOrder: 14 },
  { slug: "cardfight-vanguard", name: "Cardfight!! Vanguard", displayName: "Cardfight!! Vanguard", sortOrder: 15 },
]

async function main() {
  console.log(`Seeding ${GAME_DATA.length} games...`)

  // Upsert: insert or do nothing if slug exists
  for (const game of GAME_DATA) {
    await db
      .insert(games)
      .values(game)
      .onConflictDoNothing({ target: games.slug })
  }

  console.log(`✓ Seeded ${GAME_DATA.length} games`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Failed to seed games:", err)
  process.exit(1)
})
