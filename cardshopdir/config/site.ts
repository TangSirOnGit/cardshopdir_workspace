/** Site name -- change this to rebrand the template */
export const SITE_NAME = "CardShopDir"

/** Canonical site URL (no trailing slash) */
export const SITE_URL =
  (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "")

/** Bare domain for display */
export const SITE_DOMAIN = new URL(SITE_URL).hostname
