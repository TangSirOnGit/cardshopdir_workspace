import Redis from "ioredis"
import { env } from "@/lib/env"

declare global {
  var __redis: Redis | undefined
}

/** Whether a Redis host was explicitly configured. When false, rate limiting
 * degrades to fail-open instead of erroring every request — see lib/rate-limit.ts. */
export const isRedisConfigured = Boolean(env.REDIS_HOST)

function createRedisClient() {
  const client = new Redis({
    host: env.REDIS_HOST!,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    retryStrategy(times) {
      return Math.min(times * 50, 2000)
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    connectTimeout: 5_000,
    // Rate limiting sits in the request path — never let a slow Redis hold a
    // response open. Commands reject past this budget and callers fail open.
    commandTimeout: 1_000,
  })

  // ioredis is an EventEmitter: an unhandled "error" event throws and takes the
  // process down. Always keep a listener attached.
  client.on("error", (err) => {
    console.error("[redis]", err.message)
  })

  return client
}

/** Module-level singleton. `globalThis` additionally survives dev HMR. */
let client: Redis | undefined = globalThis.__redis

/**
 * The shared Redis client, or null when no host is configured.
 *
 * Built on first use rather than at import: constructing it eagerly meant an
 * unset `REDIS_HOST` still dialled the `127.0.0.1` fallback and reconnect-
 * looped forever on a deployment that had deliberately opted out of Redis.
 *
 * The instance is cached in every environment. Caching only in development
 * would open — and never close — a fresh TCP connection on every rate-limit
 * call in production, until Redis hit `maxclients`.
 */
export function getRedis(): Redis | null {
  if (!isRedisConfigured) return null

  if (!client) {
    client = createRedisClient()
    if (process.env.NODE_ENV !== "production") {
      globalThis.__redis = client
    }
  }
  return client
}
