import { db } from "../lib/db"
import { shops } from "../lib/db/schema"
import { eq, inArray } from "drizzle-orm"

const TARGETS = [
  {
    slug: "king-street-cards-malvern-pa",
    metaTitle: "King Street Cards — Card Shop in Malvern, PA | CardShopDir",
    metaDescription:
      "King Street Cards is a card shop in Malvern, PA. Find trading cards, store hours, ratings, reviews, directions, and contact details near Philadelphia.",
  },
  {
    slug: "kantopia-bradley-il",
    metaTitle: "Kantopia — Trading Card Shop in Bradley, IL | CardShopDir",
    metaDescription:
      "Kantopia is a trading card shop in Bradley, IL. Find card games, store hours, ratings, reviews, directions, and contact details.",
  },
  {
    slug: "piece-of-the-game-white-plains-ny",
    metaTitle: "Piece of the Game — Card Shop in White Plains, NY | CardShopDir",
    metaDescription:
      "Piece of the Game is a card shop in White Plains, NY. Find trading cards, store hours, ratings, reviews, directions, and contact details.",
  },
  {
    slug: "games-lab-auckland-auckland",
    metaTitle: "Games Lab — Card Shop in Auckland | CardShopDir",
    metaDescription:
      "Games Lab is a trading card and game shop in Auckland. Find card games, store hours, ratings, reviews, directions, and contact details.",
  },
  {
    slug: "motos-tcg-northbrook-il",
    metaTitle: "Motos TCG — Trading Card Shop in Northbrook, IL | CardShopDir",
    metaDescription:
      "Motos TCG is a trading card shop in Northbrook, IL. Find TCG products, store hours, ratings, reviews, directions, and contact details.",
  },
  {
    slug: "2-guys-sports-cards-chatham-il",
    metaTitle: "2 Guys Sports Cards — Card Shop in Chatham, IL | CardShopDir",
    metaDescription:
      "2 Guys Sports Cards is a sports card shop in Chatham, IL. Find sports cards, store hours, ratings, reviews, directions, and contact details.",
  },
  {
    slug: "cards-next-door-ephrata-pa",
    metaTitle: "Cards Next Door — Card Shop in Ephrata, PA | CardShopDir",
    metaDescription:
      "Cards Next Door is a card shop in Ephrata, PA. Find trading cards, store hours, ratings, reviews, directions, and contact details.",
  },
] as const

const apply = process.argv.includes("--apply")
const existing = await db
  .select({
    slug: shops.slug,
    name: shops.name,
    metaTitle: shops.metaTitle,
    metaDescription: shops.metaDescription,
  })
  .from(shops)
  .where(inArray(shops.slug, TARGETS.map((target) => target.slug)))

const rows = new Map(existing.map((row) => [row.slug, row]))
let changed = 0

for (const target of TARGETS) {
  const row = rows.get(target.slug)
  if (!row) {
    console.log(`NOT FOUND: ${target.slug}`)
    continue
  }

  const same =
    row.metaTitle === target.metaTitle &&
    row.metaDescription === target.metaDescription
  if (same) {
    console.log(`SKIP: ${row.name}`)
    continue
  }

  changed++
  console.log(`${apply ? "UPDATE" : "WOULD UPDATE"}: ${row.name}`)
  console.log(`  title: ${target.metaTitle}`)
  console.log(`  description: ${target.metaDescription}`)

  if (apply) {
    await db
      .update(shops)
      .set({
        metaTitle: target.metaTitle,
        metaDescription: target.metaDescription,
      })
      .where(eq(shops.slug, target.slug))
  }
}

console.log(
  `${apply ? "Applied" : "Dry run"}: ${changed} of ${TARGETS.length} target shops changed.`
)
