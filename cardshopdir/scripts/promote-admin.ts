#!/usr/bin/env bun
/**
 * Promote a user to admin by email.
 *
 * Usage:
 *   bun run scripts/promote-admin.ts you@example.com
 *
 * What it does:
 *   1. Sets `user.role = 'admin'` for the matching email
 *   2. Deletes the user's active sessions, so their next page load re-fetches
 *      auth state and the /admin link appears immediately (instead of waiting
 *      for the 5-minute Better Auth cookie cache to expire)
 */

import { db } from "@/lib/db"
import { user, session } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`

const email = process.argv[2]?.trim().toLowerCase()

if (!email) {
  console.error(red("Error: missing email argument"))
  console.error(`\nUsage: ${cyan("bun run scripts/promote-admin.ts you@example.com")}\n`)
  process.exit(1)
}

const found = await db.query.user.findFirst({
  where: eq(user.email, email),
})

if (!found) {
  console.error(red(`No user found with email "${email}"`))
  console.error(
    yellow(
      `\nTip: the account must exist. Sign up at /sign-up first, then run this script.\n`,
    ),
  )
  process.exit(1)
}

if (found.role === "admin") {
  console.log(
    yellow(`\n${email} is already an admin. Nothing to do.\n`),
  )
  process.exit(0)
}

await db.update(user).set({ role: "admin" }).where(eq(user.id, found.id))

const deleted = await db
  .delete(session)
  .where(eq(session.userId, found.id))
  .returning({ id: session.id })

console.log(`\n${green("✓")} ${email} is now an admin.`)
console.log(
  `  Revoked ${deleted.length} session(s) — the user needs to sign in again.`,
)
console.log(
  `\n  Next: sign out + sign back in, then visit ${cyan("/admin")}.\n`,
)

process.exit(0)
