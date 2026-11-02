/**
 * Generate "Best Card Shops in {State}" blog posts from live directory data.
 *
 * States are picked from GSC (cardshopdir.com, 3 months to 2026-11-02) by
 * impressions of /directory/{st}/* and /shop/*-{st} pages.
 * Michigan already exists in scripts/seed-blog-posts.sql and is skipped.
 *
 * Usage:
 *   bun run scripts/generate-state-blog-posts.ts                 # dry-run
 *   bun run scripts/generate-state-blog-posts.ts --apply         # insert posts
 *   bun run scripts/generate-state-blog-posts.ts --apply --states=CA,TX
 *
 * Safe to re-run: existing slugs are never overwritten.
 */
/// <reference types="node" />
import { db } from "../lib/db"
import { shops, shopGames, games, posts, user } from "../lib/db/schema"
import { and, eq, sql, desc } from "drizzle-orm"
import { stateName, shopTypeLabel } from "../lib/directory"

const DEFAULT_STATES = [
  "CA", "IL", "FL", "TX", "NY", "OH", "IN", "VA", "AL", "NC",
  "PA", "MA", "OR", "NM", "AZ", "AR", "IA", "WI",
]
const AUTHOR_ID = "admin-cardshopdir"
const YEAR = new Date().getFullYear()

const apply = process.argv.includes("--apply")
const statesArg = process.argv.find((a) => a.startsWith("--states="))
const STATES = statesArg
  ? statesArg.slice(9).split(",").map((s) => s.trim().toUpperCase())
  : DEFAULT_STATES

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-")
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const pct = (n: number, total: number) =>
  total ? Math.round((n / total) * 100) : 0

async function buildPost(code: string) {
  const full = stateName(code)
  const stateSlug = code.toLowerCase()

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(shops)
    .where(eq(shops.state, code))
  if (total < 10) return null

  const cities = await db
    .select({ city: shops.city, n: sql<number>`count(*)::int` })
    .from(shops)
    .where(
      and(eq(shops.state, code), sql`${shops.city} is not null and ${shops.city} != ''`)
    )
    .groupBy(shops.city)
    .orderBy(desc(sql`count(*)`), shops.city)
  const topCities = cities.slice(0, 8)

  const gameRows = await db
    .select({
      slug: games.slug,
      displayName: games.displayName,
      n: sql<number>`count(distinct ${shopGames.shopId})::int`,
    })
    .from(games)
    .innerJoin(shopGames, eq(games.id, shopGames.gameId))
    .innerJoin(shops, eq(shops.id, shopGames.shopId))
    .where(eq(shops.state, code))
    .groupBy(games.slug, games.displayName)
    .orderBy(desc(sql`count(distinct ${shopGames.shopId})`))
    .limit(6)

  const topShops = await db
    .select({
      slug: shops.slug,
      name: shops.name,
      city: shops.city,
      type: shops.shopType,
      rating: shops.ratingValue,
      reviews: shops.reviewCount,
    })
    .from(shops)
    .where(
      and(
        eq(shops.state, code),
        sql`${shops.ratingValue} is not null and coalesce(${shops.reviewCount}, 0) >= 10`
      )
    )
    .orderBy(desc(shops.ratingValue), desc(shops.reviewCount))
    .limit(10)

  const typeRows = await db
    .select({ type: shops.shopType, n: sql<number>`count(*)::int` })
    .from(shops)
    .where(eq(shops.state, code))
    .groupBy(shops.shopType)
    .orderBy(desc(sql`count(*)`))
    .limit(3)

  const cityLink = (c: string) =>
    `<a href="/directory/${stateSlug}/${slugify(c)}">${esc(c)}</a>`

  const title = `Best Card Shops in ${full} (${YEAR}): A Guide to ${total} Local Stores`
  const slug = `best-card-shops-in-${slugify(full)}`
  const topCity = topCities[0]
  const topGame = gameRows[0]

  const excerpt = `Looking for card shops in ${full}? Browse ${total} trading card and game stores across ${cities.length} cities${
    topCity ? `, from ${topCity.city} to smaller towns` : ""
  } — with the top-rated shops, popular games, and tips for finding the right local card store.`

  const parts: string[] = []
  parts.push(
    `<p>${esc(full)} has <a href="/directory/${stateSlug}">${total} card shops across ${cities.length} cities</a> in our directory${
      topGame
        ? `, and ${topGame.n} of them carry ${esc(topGame.displayName)}`
        : ""
    }. Whether you want to pick up booster boxes, join a weekly league, buy singles, or hunt for graded sports cards, this guide shows where to start in ${esc(full)}. Every listing includes hours, ratings, directions, and the games each store carries.</p>`
  )

  if (topCities.length) {
    parts.push(`<h2>Cities With the Most Card Shops in ${esc(full)}</h2>`)
    parts.push(
      `<p>These ${esc(full)} cities have the largest number of listed card stores:</p>\n<ul>\n${topCities
        .map(
          (c) =>
            `  <li><strong>${cityLink(c.city!)}</strong> — ${c.n} shop${c.n === 1 ? "" : "s"}</li>`
        )
        .join("\n")}\n</ul>`
    )
    parts.push(
      `<p>Not near one of these? Browse the full list of <a href="/directory/${stateSlug}">${esc(full)} card shops by city</a>. Smaller towns often have a single shop that doubles as the local gathering spot for the whole community.</p>`
    )
  }

  if (topShops.length >= 3) {
    parts.push(`<h2>Top-Rated Card Shops in ${esc(full)}</h2>`)
    parts.push(
      `<p>Based on customer ratings and review counts in our directory, these ${esc(full)} stores stand out:</p>\n<ol>\n${topShops
        .map(
          (s) =>
            `  <li><a href="/shop/${s.slug}"><strong>${esc(s.name)}</strong></a>${
              s.city ? ` — ${esc(s.city)}, ${code}` : ""
            } (${shopTypeLabel(s.type)}, rated ${Number(s.rating).toFixed(1)} from ${s.reviews} reviews)</li>`
        )
        .join("\n")}\n</ol>`
    )
    parts.push(
      `<p>Ratings come from public reviews and change over time, so always check a shop's page for current hours and contact details before you visit.</p>`
    )
  }

  if (gameRows.length) {
    parts.push(`<h2>What Games Do ${esc(full)} Card Shops Carry?</h2>`)
    parts.push(
      `<p>Based on our directory data, these games are carried by the most ${esc(full)} stores:</p>\n<ol>\n${gameRows
        .map(
          (g) =>
            `  <li><strong>${esc(g.displayName)}</strong> — ${g.n} shops (${pct(g.n, total)}% of stores)</li>`
        )
        .join("\n")}\n</ol>`
    )
    const links = gameRows
      .slice(0, 3)
      .map(
        (g) =>
          `<a href="/directory/${stateSlug}/games/${g.slug}">${esc(g.displayName)} shops in ${esc(full)}</a>`
      )
      .join(", ")
    parts.push(
      `<p>Looking for one game in particular? Try ${links}, or see the nationwide <a href="/directory/games">game directory</a>.</p>`
    )
  }

  if (typeRows.length) {
    parts.push(`<h2>Types of Card Stores in ${esc(full)}</h2>`)
    parts.push(
      `<p>${esc(full)}'s stores range from dedicated TCG specialists to broader hobby stores. The most common types listed are ${typeRows
        .map((t) => `${shopTypeLabel(t.type).toLowerCase()}s (${t.n})`)
        .join(", ")}. TCG specialty stores usually have the deepest singles inventory and run regular tournaments, while comic and game shops tend to stock a mix of sealed product, board games, and collectibles.</p>`
    )
  }

  parts.push(`<h2>How to Choose a Card Shop in ${esc(full)}</h2>`)
  parts.push(
    `<ul>
  <li><strong>Check the games they carry.</strong> Not every store supports every game — confirm that your game is listed before you drive over.</li>
  <li><strong>Look at hours.</strong> Many independent shops open late and run events on weeknights; check today's hours on the shop page.</li>
  <li><strong>Ask about events.</strong> Pokémon leagues, Magic Friday Night events, and Yu-Gi-Oh! locals are the easiest way to meet other players.</li>
  <li><strong>Call ahead for specific items.</strong> If you want a particular sealed product or a graded card, a quick phone call saves a wasted trip.</li>
  <li><strong>Support local.</strong> Independent shops depend on regulars. Buying singles and sealed product locally keeps ${esc(full)}'s card community alive.</li>
</ul>`
  )

  parts.push(`<h2>Find More Card Shops Near You</h2>`)
  parts.push(
    `<p>Use <a href="/near-me">card shops near me</a> to search by location, or browse the <a href="/directory/${stateSlug}">${esc(full)} directory</a> to filter by city. Know a shop that is missing or out of date? Let us know through the shop page so other collectors get accurate information.</p>`
  )

  return {
    title,
    slug,
    excerpt,
    content: parts.join("\n\n"),
  }
}

async function main() {
  const [admin] = await db.select({ id: user.id }).from(user).where(eq(user.id, AUTHOR_ID))
  if (!admin && apply) {
    throw new Error(
      `Author user '${AUTHOR_ID}' not found. Run scripts/seed-blog-posts.sql first.`
    )
  }

  let created = 0
  for (const code of STATES) {
    const post = await buildPost(code)
    if (!post) {
      console.log(`- ${code}: skipped (too few shops)`)
      continue
    }
    const [exists] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, post.slug))
    if (exists) {
      console.log(`- ${code}: exists (${post.slug})`)
      continue
    }
    console.log(
      `+ ${code}: ${post.slug} (${post.content.length} chars) ${apply ? "inserting" : "[dry-run]"}`
    )
    if (apply) {
      await db.insert(posts).values({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: "published",
        authorId: AUTHOR_ID,
        publishedAt: new Date(),
      })
      created++
    }
  }
  console.log(apply ? `Inserted ${created} posts.` : "Dry-run only. Re-run with --apply.")
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
