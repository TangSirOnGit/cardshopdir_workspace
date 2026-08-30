import "server-only"
import { timingSafeEqual } from "node:crypto"

/**
 * Constant-time comparison of a cron bearer token.
 *
 * Shared by every cron route so the comparison is fixed in one place — a naive
 * `===` leaks the secret one byte at a time through response timing.
 */
export function verifyCronToken(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
