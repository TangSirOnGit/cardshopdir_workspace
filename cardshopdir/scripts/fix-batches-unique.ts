#!/usr/bin/env bun
/**
 * Migration: normalize `batches_week_year` and `votes_user_product` as
 * standalone UNIQUE INDEXES (drizzle-kit `uniqueIndex(...)` emits those,
 * not table CONSTRAINTS, so the two must match to avoid false diffs).
 *
 * Usage:
 *   bun run scripts/fix-batches-unique.ts            # diagnose + fix
 *   bun run scripts/fix-batches-unique.ts --dry-run  # read-only audit
 *
 * Idempotent, safe. No data is modified.
 */

import postgres from "postgres"

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

const DRY = process.argv.includes("--dry-run")

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error(red("DATABASE_URL is not set. Aborting."))
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { onnotice: () => {} })

type Target = {
  table: string
  indexName: string
  columns: string[]
  dupCheck: () => Promise<{ col: string; count: number }[]>
}

const targets: Target[] = [
  {
    table: "batches",
    indexName: "batches_week_year",
    columns: ["week_number", "year"],
    dupCheck: async () => {
      const r = await sql<{ col: string; count: number }[]>`
        SELECT week_number || ',' || year AS col, COUNT(*)::int AS count
        FROM batches
        GROUP BY week_number, year
        HAVING COUNT(*) > 1
      `
      return r
    },
  },
  {
    table: "votes",
    indexName: "votes_user_product",
    columns: ["user_id", "product_id"],
    dupCheck: async () => {
      const r = await sql<{ col: string; count: number }[]>`
        SELECT user_id || ',' || product_id::text AS col, COUNT(*)::int AS count
        FROM votes
        GROUP BY user_id, product_id
        HAVING COUNT(*) > 1
      `
      return r
    },
  },
]

try {
  for (const t of targets) {
    console.log(cyan(`\n=== ${t.table}.${t.indexName} ===`))

    // Current state
    const constraint = await sql<{ name: string }[]>`
      SELECT conname AS name
      FROM pg_constraint
      WHERE conname = ${t.indexName}
    `
    const idx = await sql<{ name: string; def: string }[]>`
      SELECT indexname AS name, indexdef AS def
      FROM pg_indexes
      WHERE indexname = ${t.indexName}
    `

    console.log(
      `  Constraint: ${constraint.length ? green("present") : dim("absent")}`,
    )
    console.log(
      `  Index:      ${idx.length ? green("present") : dim("absent")}${idx.length ? dim(`  (${idx[0].def})`) : ""}`,
    )

    if (DRY) continue

    // Dup check
    const dups = await t.dupCheck()
    if (dups.length > 0) {
      console.error(red(`  ✗ Duplicates found on ${t.table}:`))
      for (const d of dups) {
        console.error(`    ${d.col} — ${d.count} rows`)
      }
      process.exit(1)
    }

    // Normalize: drop any existing constraint / index with that name, recreate
    // as a standalone UNIQUE INDEX (what `uniqueIndex()` expects in drizzle).
    await sql.begin(async (tx) => {
      await tx.unsafe(
        `ALTER TABLE ${t.table} DROP CONSTRAINT IF EXISTS ${t.indexName}`,
      )
      await tx.unsafe(`DROP INDEX IF EXISTS ${t.indexName}`)
      await tx.unsafe(
        `CREATE UNIQUE INDEX ${t.indexName} ON ${t.table} (${t.columns.join(", ")})`,
      )
    })

    console.log(green(`  ✓ Normalized as UNIQUE INDEX.`))
  }

  if (DRY) {
    console.log(yellow("\n(dry-run — no changes applied)"))
    process.exit(0)
  }

  console.log(
    green(
      "\n✓ All unique indexes normalized. Run `bun db:push` — no prompt should appear.\n",
    ),
  )
  process.exit(0)
} catch (err) {
  console.error(red("\n✗ Failed:"), err)
  process.exit(1)
} finally {
  await sql.end()
}
