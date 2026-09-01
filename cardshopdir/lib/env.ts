import { z } from "zod"

/** Treat empty-string env vars ("" from `.env.example`) as undefined so
 * optional `.email()` / `.url()` refinements don't fail on unset values. */
const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.email().optional()
)
const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.url().optional()
)
const optionalIndexNowKey = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .regex(
      /^[A-Za-z0-9-]{8,128}$/,
      "must contain 8-128 letters, numbers, or dashes"
    )
    .optional()
)

const server = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),

  // OAuth (optional — features degrade gracefully)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // R2 storage (optional — upload disabled if missing)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // Stripe (optional — paid tiers disabled if missing)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Redis (optional — when REDIS_HOST is unset, rate limiting is genuinely
  // disabled and logs a warning, rather than erroring on every request)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default(""),
  REDIS_DB: z.coerce.number().default(0),

  // Plunk (optional — emails disabled if missing)
  PLUNK_SECRET_KEY: z.string().optional(),
  PLUNK_PUBLIC_KEY: z.string().optional(),
  PLUNK_FROM_EMAIL: optionalEmail,

  // Cron (optional)
  CRON_SECRET: z.string().optional(),

  // IndexNow (optional — URL submission disabled if missing)
  INDEXNOW_KEY: optionalIndexNowKey,
  INDEXNOW_ENDPOINT: optionalUrl,
  INDEXNOW_SITEMAP_URL: optionalUrl,

  // Turnstile (optional — captcha disabled if missing)
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Discord (optional)
  DISCORD_WEBHOOK_URL: optionalUrl,
})

const client = z.object({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
  NEXT_PUBLIC_CDN_HOSTNAME: z.string().optional(),
})

const merged = server.merge(client)

function validateEnv() {
  const parsed = merged.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    console.error("\n❌ Invalid environment variables:\n")
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(", ")}`)
    }
    console.error("\nCheck your .env file against .env.example\n")
    process.exit(1)
  }

  return parsed.data
}

export const env = validateEnv()
