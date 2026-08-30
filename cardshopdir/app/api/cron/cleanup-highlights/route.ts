import { NextRequest } from "next/server"
import { env } from "@/lib/env"
import { verifyCronToken } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq, and, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const secret = env.CRON_SECRET
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    )
  }

  const auth = request.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token || !verifyCronToken(token, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const expired = await db.query.products.findMany({
    where: and(
      eq(products.tier, "highlight"),
      lte(products.highlightExpiresAt, now),
    ),
  })

  if (expired.length === 0) {
    return Response.json({ ok: true, cleaned: 0 })
  }

  for (const p of expired) {
    await db
      .update(products)
      .set({ highlightExpiresAt: null })
      .where(eq(products.id, p.id))
  }

  revalidatePath("/")

  const names = expired.map((p) => p.name)
  console.log(`Cleaned up ${expired.length} expired highlights: ${names.join(", ")}`)

  return Response.json({ ok: true, cleaned: expired.length, names })
}
