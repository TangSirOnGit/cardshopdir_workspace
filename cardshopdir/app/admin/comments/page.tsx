import { db } from "@/lib/db"
import { comments, user, products } from "@/lib/db/schema"
import { desc, asc, count, ilike, eq, or, and } from "drizzle-orm"
import type { SearchParams } from "nuqs/server"
import { commentsParamsCache } from "./search-params"
import { CommentTable } from "./_components/comment-table"

const PER_PAGE = 20

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AdminCommentsPage({ searchParams }: Props) {
  const { page, q, status, sort } =
    await commentsParamsCache.parse(searchParams)

  const conditions = []
  if (q) {
    conditions.push(
      or(
        ilike(comments.body, `%${q}%`),
        ilike(user.name, `%${q}%`),
        ilike(products.name, `%${q}%`),
      ),
    )
  }
  if (status) {
    conditions.push(eq(comments.status, status))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const orderBy =
    sort === "oldest" ? asc(comments.createdAt) : desc(comments.createdAt)

  const [totalResult] = await db
    .select({ count: count() })
    .from(comments)
    .leftJoin(user, eq(comments.userId, user.id))
    .leftJoin(products, eq(comments.productId, products.id))
    .where(where)
  const total = totalResult.count
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)

  const items = await db
    .select({
      id: comments.id,
      body: comments.body,
      status: comments.status,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      userName: user.name,
      userEmail: user.email,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(comments)
    .leftJoin(user, eq(comments.userId, user.id))
    .leftJoin(products, eq(comments.productId, products.id))
    .where(where)
    .orderBy(orderBy)
    .limit(PER_PAGE)
    .offset((safePage - 1) * PER_PAGE)

  return (
    <CommentTable
      comments={items.map((c) => ({
        id: c.id,
        body: c.body,
        status: c.status,
        parentId: c.parentId,
        createdAt: c.createdAt.toISOString(),
        userName: c.userName ?? "Unknown",
        userEmail: c.userEmail ?? "",
        productName: c.productName ?? "Unknown",
        productSlug: c.productSlug ?? "",
      }))}
      total={total}
      page={safePage}
      totalPages={totalPages}
    />
  )
}
