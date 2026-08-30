import { getRedis } from "./redis"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
  /** True when the limit could not be evaluated (Redis missing or failing) and
   * the request was allowed through anyway. */
  degraded?: boolean
}

let warnedMissingRedis = false

/**
 * Fixed-window rate limiter using Redis INCR + EXPIRE.
 *
 * Skipped entirely in development (NODE_ENV !== "production").
 *
 * Fails **open** by design: a rate limiter that 500s when Redis is unreachable
 * turns an infrastructure blip into a full outage. Every degraded decision is
 * logged and flagged so the condition stays visible instead of silent.
 */
export async function rateLimit({
  key,
  limit,
  windowSeconds,
}: {
  key: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitResult> {
  // No rate limiting in development
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, remaining: limit, resetIn: 0 }
  }

  const redis = getRedis()
  if (!redis) {
    if (!warnedMissingRedis) {
      warnedMissingRedis = true
      console.warn(
        "[rate-limit] REDIS_HOST is not set — rate limiting is DISABLED. " +
          "Set REDIS_HOST to protect public routes from abuse.",
      )
    }
    return { allowed: true, remaining: limit, resetIn: 0, degraded: true }
  }

  const windowKey = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`

  try {
    const results = await redis
      .multi()
      .incr(windowKey)
      .expire(windowKey, windowSeconds)
      .exec()

    // exec() yields [error, value] tuples. Reading results[0][1] without
    // checking results[0][0] silently turns a Redis error into "0 requests
    // used", which lets every caller through unnoticed.
    const incr = results?.[0]
    if (!incr) throw new Error("empty MULTI reply")
    const [incrErr, incrValue] = incr
    if (incrErr) throw incrErr
    if (typeof incrValue !== "number") {
      throw new Error(`unexpected INCR reply: ${typeof incrValue}`)
    }

    const allowed = incrValue <= limit

    // The decision is already made. A TTL lookup is only for the retry hint,
    // so its failure must not fall through to the catch below and turn a deny
    // into an allow — it is far likelier to time out than the INCR, given the
    // one-second command budget.
    const ttl = await redis.ttl(windowKey).catch(() => -1)

    return {
      allowed,
      remaining: Math.max(0, limit - incrValue),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    }
  } catch (err) {
    console.error(
      `[rate-limit] failing open for "${key}":`,
      err instanceof Error ? err.message : err,
    )
    return { allowed: true, remaining: limit, resetIn: 0, degraded: true }
  }
}
