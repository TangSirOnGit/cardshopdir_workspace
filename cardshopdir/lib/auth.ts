import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, captcha } from "better-auth/plugins"
import { db } from "./db"
import * as schema from "./db/schema"
import { plunk } from "./plunk"
import { notifyNewUser } from "./discord"
import { sendVerificationEmail, sendPasswordResetEmail } from "./emails"
import { env } from "@/lib/env"

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {}

if (env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim()) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID.trim(),
    clientSecret: env.GOOGLE_CLIENT_SECRET.trim(),
  }
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders,
  plugins: [
    admin(),
    // Captcha only enabled when Turnstile is configured. Without a secret key,
    // the plugin would reject every signup, so we drop it silently in dev.
    ...(env.TURNSTILE_SECRET_KEY
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: env.TURNSTILE_SECRET_KEY,
          }),
        ]
      : []),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      sendPasswordResetEmail(user.email, url).catch(console.error)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const verifyUrl = new URL(url)
      verifyUrl.searchParams.set("callbackURL", "/email-verified")
      sendVerificationEmail(user.email, verifyUrl.toString()).catch(console.error)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  account: {
    encryptOAuthTokens: true,
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 5 },
      "/api/auth/sign-up/email": { window: 60, max: 3 },
      "/api/auth/request-password-reset": { window: 60, max: 3 },
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          plunk
            .track({
              email: user.email,
              event: "user_signed_up",
              subscribed: true,
              data: { name: user.name },
            })
            .catch(console.error)

          notifyNewUser(user.name, user.email).catch(console.error)
        },
      },
    },
  },
})
