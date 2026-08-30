"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { votes, products } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { getSettingsTyped } from "@/lib/settings"

interface VoteResult {
  voted: boolean
  voteCount: number
  error?: string
  resetMinutes?: number
}

export async function toggleVote(productId: number): Promise<VoteResult> {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })

  if (!session) {
    throw new Error("Unauthorized")
  }

  if (!productId || typeof productId !== "number") {
    throw new Error("Invalid productId")
  }

  const userId = session.user.id
  const ip = getClientIp(h)

  const settings = await getSettingsTyped()

  const { allowed, resetIn } = await rateLimit({
    key: `votes:${userId}`,
    limit: settings.votesPerWindow,
    windowSeconds: settings.votesWindowSeconds,
  })

  if (!allowed) {
    const minutes = Math.ceil(resetIn / 60)
    return {
      voted: false,
      voteCount: 0,
      error: "Too many votes",
      resetMinutes: minutes,
    }
  }

  // Check if user already voted
  const existing = await db.query.votes.findFirst({
    where: and(eq(votes.userId, userId), eq(votes.productId, productId)),
  })

  if (existing) {
    // Unvote
    await db.transaction(async (tx) => {
      await tx.delete(votes).where(eq(votes.id, existing.id))
      await tx
        .update(products)
        .set({ voteCount: sql`GREATEST(${products.voteCount} - 1, 0)` })
        .where(eq(products.id, productId))
    })

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { voteCount: true },
    })

    return { voted: false, voteCount: product?.voteCount ?? 0 }
  }

  // Check IP: max 1 vote per product per IP
  const ipVote = await db.query.votes.findFirst({
    where: and(eq(votes.ip, ip), eq(votes.productId, productId)),
  })

  if (ipVote) {
    return {
      voted: false,
      voteCount: 0,
      error: "Already voted from this network",
    }
  }

  // Vote
  await db.transaction(async (tx) => {
    await tx.insert(votes).values({ userId, productId, ip })
    await tx
      .update(products)
      .set({ voteCount: sql`${products.voteCount} + 1` })
      .where(eq(products.id, productId))
  })

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { voteCount: true },
  })

  return { voted: true, voteCount: product?.voteCount ?? 0 }
}
