import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import * as relations from "./relations"
import { env } from "@/lib/env"

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>
}

// During `next build`, each static-generation worker is a separate process
// with its own pool, and workers default to CPUs - 1. On a many-core build
// machine, 15 workers × max: 10 = 150 connections — past the max_connections
// of a small Postgres instance, which fails the build with FATAL 53300.
// One connection per build worker is plenty; pages prerender serially.
const isBuild = process.env.NEXT_PHASE === "phase-production-build"

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: isBuild ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client
}

export const db = drizzle(client, { schema: { ...schema, ...relations } })
