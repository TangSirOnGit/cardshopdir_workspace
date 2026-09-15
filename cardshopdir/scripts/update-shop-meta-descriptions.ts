/**
 * Update metaDescription for high-value shops that already rank in SEMrush.
 *
 * These shops have brand-name keywords with real search volume. Instead of
 * relying on the generic fallback template, we write hand-tuned descriptions
 * that include the shop name, city, state, game specialties, and a
 * call-to-action — optimized for the specific keywords they already rank for.
 *
 * Usage:
 *   bun run scripts/update-shop-meta-descriptions.ts          # dry-run (default)
 *   bun run scripts/update-shop-meta-descriptions.ts --apply  # write to DB
 *
 * Safe to re-run: only updates shops whose metaDescription is NULL or
 * differs from the target value. Prints a summary before applying.
 */
/// <reference types="node" />
import { db } from "../lib/db"
import { shops } from "../lib/db/schema"
import { eq, inArray } from "drizzle-orm"

// ── High-value shop slugs (from SEMrush top-20 brand keywords) ──────────────
// Each entry includes the slug and a hand-tuned meta description (~150-160 chars).
// Descriptions target the actual keywords these shops rank for.
const HIGH_VALUE_SHOPS: { slug: string; metaDescription: string }[] = [
  {
    slug: "bleecker-trading-new-york-ny",
    metaDescription:
      "Bleecker Trading is a trading card shop in New York, NY carrying Pokémon, Magic: The Gathering, and Yu-Gi-Oh!. Find hours, ratings, directions, and trading cards in NYC.",
  },
  {
    slug: "kingslayer-games-fountain-valley-ca",
    metaDescription:
      "Kingslayer Games is a trading card shop in Fountain Valley, CA carrying Pokémon, Magic: The Gathering, and Yu-Gi-Oh!. Find store hours, ratings, directions, and events.",
  },
  {
    slug: "chicagoland-games-dice-dojo-chicago-il",
    metaDescription:
      "Chicagoland Games Dice Dojo is a trading card and board game shop in Chicago, IL carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find hours, ratings, directions, and events.",
  },
  {
    slug: "la-sports-cards-glendale-ca",
    metaDescription:
      "LA Sports Cards is a sports card and trading card shop in Glendale, CA. Find store hours, ratings, directions, and sports cards for sale near Los Angeles.",
  },
  {
    slug: "nakama-toys-chicago-il",
    metaDescription:
      "Nakama Toys is a trading card and anime shop in Chicago, IL carrying Pokémon, Yu-Gi-Oh!, and Japanese imports. Find store hours, ratings, and directions.",
  },
  {
    slug: "the-gamers-haven-spokane-wa",
    metaDescription:
      "The Gamers Haven is a trading card and game shop in Spokane, WA carrying Pokémon, MTG, Yu-Gi-Oh!, and board games. Find store hours, ratings, and directions.",
  },
  {
    slug: "victory-comics-falls-church-va",
    metaDescription:
      "Victory Comics is a comic and trading card shop in Falls Church, VA carrying Pokémon, MTG, Yu-Gi-Oh!, and comics. Find store hours, ratings, and directions.",
  },
  {
    slug: "the-mighty-meeple-concord-nc",
    metaDescription:
      "The Mighty Meeple is a trading card and board game shop in Concord, NC carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find store hours, ratings, and directions.",
  },
  {
    slug: "indy-card-exchange-indianapolis-in",
    metaDescription:
      "Indy Card Exchange is a trading card shop in Indianapolis, IN carrying Pokémon, MTG, Yu-Gi-Oh!, and sports cards. Find store hours, ratings, and directions.",
  },
  {
    slug: "geeky-teas-games-burbank-ca",
    metaDescription:
      "Geeky Teas & Games is a trading card and board game shop in Burbank, CA carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find store hours, ratings, and directions.",
  },
  {
    slug: "north-40-outfitters-coeur-dalene-id",
    metaDescription:
      "North 40 Outfitters in Coeur d'Alene, ID carries trading cards, outdoor gear, and more. Find store hours, ratings, directions, and trading card products near you.",
  },
  {
    slug: "tabletop-gaming-center-newington-ct",
    metaDescription:
      "Tabletop Gaming Center is a trading card and board game shop in Newington, CT carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find store hours, ratings, and directions.",
  },
  {
    slug: "game-grid-lehi-lehi-ut",
    metaDescription:
      "Game Grid in Lehi, UT is a trading card and board game shop carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find store hours, ratings, and directions.",
  },
  {
    slug: "diamond-9-sports-cards-placentia-ca",
    metaDescription:
      "Diamond 9 Sports Cards is a sports card and trading card shop in Placentia, CA. Find store hours, ratings, directions, and sports cards for sale near you.",
  },
  {
    slug: "waukesha-sportscards-waukesha-wi",
    metaDescription:
      "Waukesha Sportscards is a sports card and trading card shop in Waukesha, WI. Find store hours, ratings, directions, and sports cards for sale near you.",
  },
  {
    slug: "duncans-sports-cards-jonesboro-ar",
    metaDescription:
      "Duncan's Sports Cards is a sports card and trading card shop in Jonesboro, AR. Find store hours, ratings, directions, and sports cards for sale near you.",
  },
  {
    slug: "comic-book-hideout-fullerton-ca",
    metaDescription:
      "Comic Book Hideout is a comic and trading card shop in Fullerton, CA carrying Pokémon, MTG, Yu-Gi-Oh!, and comics. Find store hours, ratings, and directions.",
  },
  {
    slug: "the-stadium-frankenmuth-frankenmuth-mi",
    metaDescription:
      "The Stadium is a sports card and trading card shop in Frankenmuth, MI. Find store hours, ratings, directions, and sports cards for sale near you.",
  },
  {
    slug: "mission-board-games-mission-mission-ks",
    metaDescription:
      "Mission Board Games is a board game and trading card shop in Mission, KS carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find store hours, ratings, and directions.",
  },
  {
    slug: "the-peoples-card-shop-las-vegas-nv",
    metaDescription:
      "The People's Card Shop is a trading card shop in Las Vegas, NV carrying Pokémon, MTG, Yu-Gi-Oh!, and more. Find store hours, ratings, and directions.",
  },
]

async function main() {
  const apply = process.argv.includes("--apply")
  const slugs = HIGH_VALUE_SHOPS.map((s) => s.slug)

  console.log(
    `\n${apply ? "[APPLY]" : "[DRY RUN]"} Updating metaDescription for ${slugs.length} high-value shops\n`
  )

  // Fetch current state
  const existing = await db
    .select({
      slug: shops.slug,
      name: shops.name,
      metaDescription: shops.metaDescription,
    })
    .from(shops)
    .where(inArray(shops.slug, slugs))

  const existingMap = new Map(existing.map((s) => [s.slug, s]))

  let toUpdate = 0
  let skipped = 0
  let notFound = 0

  for (const target of HIGH_VALUE_SHOPS) {
    const row = existingMap.get(target.slug)
    if (!row) {
      console.log(`  ✗ NOT FOUND: ${target.slug}`)
      notFound++
      continue
    }

    const current = row.metaDescription
    if (current === target.metaDescription) {
      console.log(`  = SKIP (already set): ${row.name}`)
      skipped++
      continue
    }

    console.log(`  ~ UPDATE: ${row.name}`)
    console.log(`    OLD: ${current || "(null)"}`)
    console.log(`    NEW: ${target.metaDescription}`)
    toUpdate++
  }

  console.log(
    `\nSummary: ${toUpdate} to update, ${skipped} skipped, ${notFound} not found`
  )

  if (!apply) {
    console.log(
      "\nDry run — no changes made. Run with --apply to write to database."
    )
    return
  }

  if (toUpdate === 0) {
    console.log("Nothing to update.")
    return
  }

  // Apply updates
  for (const target of HIGH_VALUE_SHOPS) {
    const row = existingMap.get(target.slug)
    if (!row || row.metaDescription === target.metaDescription) continue

    await db
      .update(shops)
      .set({ metaDescription: target.metaDescription })
      .where(eq(shops.slug, target.slug))
    console.log(`  ✓ Updated: ${row.name}`)
  }

  console.log(`\nDone. Updated ${toUpdate} shop meta descriptions.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err)
    process.exit(1)
  })
