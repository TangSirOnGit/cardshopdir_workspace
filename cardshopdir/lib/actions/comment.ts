"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { comments, products } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { getSettingsTyped } from "@/lib/settings"
import { requireAdmin } from "@/lib/admin"
import { moderateComment, isSpamSubmission } from "@/lib/moderation"

// ── Types ─────────────────────────────────────────────────────────

interface PostCommentResult {
  ok?: boolean
  error?: string
  resetMinutes?: number
}

// ── Post comment ──────────────────────────────────────────────────

export async function postComment(
  productId: number,
  slug: string,
  body: string,
  parentId: number | null,
  honeypot: string,
  formLoadedAt: number,
): Promise<PostCommentResult> {
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })

  if (!session) {
    throw new Error("Unauthorized")
  }

  // Spam honeypot + timing (silent reject — bots don't see an error)
  if (isSpamSubmission(honeypot, formLoadedAt)) {
    return { ok: true }
  }

  // Validate inputs
  if (!productId || typeof productId !== "number") {
    return { error: "Invalid product" }
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true },
  })
  if (!product) {
    return { error: "Product not found" }
  }

  const trimmed = body.trim()
  if (!trimmed || trimmed.length > 1000) {
    return { error: "Comment must be between 1 and 1000 characters" }
  }

  // Content moderation (profanity EN/FR, link spam, caps, repetition)
  const moderation = moderateComment(trimmed)
  if (!moderation.allowed) {
    return { error: moderation.reason ?? "Comment rejected" }
  }

  // Threading: validate parentId
  if (parentId !== null) {
    const parent = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, parentId),
        eq(comments.productId, productId),
      ),
      columns: { id: true, parentId: true },
    })

    if (!parent) {
      return { error: "Parent comment not found" }
    }

    if (parent.parentId !== null) {
      return { error: "Cannot reply to a reply" }
    }
  }

  const userId = session.user.id
  const ip = getClientIp(h)

  // Rate limit per user
  const settings = await getSettingsTyped()
  const { allowed, resetIn } = await rateLimit({
    key: `comments:${userId}`,
    limit: settings.commentsPerWindow,
    windowSeconds: settings.commentsWindowSeconds,
  })

  if (!allowed) {
    return {
      error: "Too many comments",
      resetMinutes: Math.ceil(resetIn / 60),
    }
  }

  // Rate limit per IP (prevent multi-account spam)
  const { allowed: ipAllowed } = await rateLimit({
    key: `comments-ip:${ip}`,
    limit: settings.commentsPerWindow * 2,
    windowSeconds: settings.commentsWindowSeconds,
  })

  if (!ipAllowed) {
    return { error: "Too many comments from this network" }
  }

  // Duplicate detection: same user, same product, same body in last 5 min
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
  const duplicate = await db.query.comments.findFirst({
    where: and(
      eq(comments.userId, userId),
      eq(comments.productId, productId),
      eq(comments.body, trimmed),
      gte(comments.createdAt, fiveMinAgo),
    ),
    columns: { id: true },
  })

  if (duplicate) {
    return { error: "Duplicate comment" }
  }

  // Insert
  await db.insert(comments).values({
    productId,
    userId,
    parentId,
    body: trimmed,
    ip,
  })

  revalidatePath(`/p/${slug}`, "page")

  return { ok: true }
}

// ── Delete own comment ────────────────────────────────────────────

export async function deleteOwnComment(
  commentId: number,
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    throw new Error("Unauthorized")
  }

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, userId: true },
  })

  if (!comment) {
    return { ok: false, error: "Comment not found" }
  }

  if (comment.userId !== session.user.id) {
    return { ok: false, error: "Not your comment" }
  }

  await db.delete(comments).where(eq(comments.id, commentId))

  revalidatePath(`/p/${slug}`, "page")

  return { ok: true }
}

// ── Admin: update comment status ──────────────────────────────────

export async function adminUpdateComment(
  id: number,
  status: "approved" | "rejected",
): Promise<{ ok: boolean }> {
  await requireAdmin()

  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid status")
  }

  const comment = await db
    .select({ id: comments.id, productId: comments.productId })
    .from(comments)
    .where(eq(comments.id, id))
    .then((rows) => rows[0])

  if (!comment) throw new Error("Comment not found")

  const product = await db.query.products.findFirst({
    where: eq(products.id, comment.productId),
    columns: { slug: true },
  })

  await db.update(comments).set({ status }).where(eq(comments.id, id))

  revalidatePath("/admin/comments")
  if (product) revalidatePath(`/p/${product.slug}`)

  return { ok: true }
}

// ── Admin: delete comment ─────────────────────────────────────────

export async function adminDeleteComment(id: number): Promise<{ ok: boolean }> {
  await requireAdmin()

  const comment = await db
    .select({ id: comments.id, productId: comments.productId })
    .from(comments)
    .where(eq(comments.id, id))
    .then((rows) => rows[0])

  if (!comment) throw new Error("Comment not found")

  const product = await db.query.products.findFirst({
    where: eq(products.id, comment.productId),
    columns: { slug: true },
  })

  await db.delete(comments).where(eq(comments.id, id))

  revalidatePath("/admin/comments")
  if (product) revalidatePath(`/p/${product.slug}`)

  return { ok: true }
}
