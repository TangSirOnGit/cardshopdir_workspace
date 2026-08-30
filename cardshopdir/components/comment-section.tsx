import { db } from "@/lib/db"
import { comments, user } from "@/lib/db/schema"
import { eq, and, desc, isNull, count, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { CommentList } from "./comment-list"

const COMMENTS_PER_PAGE = 10

interface Props {
  productId: number
  slug: string
  page?: number
  totalCount: number
}

export async function CommentSection({ productId, slug, page = 1, totalCount }: Props) {
  const safePage = Math.max(1, page)

  // Count root comments only (replies are loaded with their parent)
  const [totalResult] = await db
    .select({ count: count() })
    .from(comments)
    .where(
      and(
        eq(comments.productId, productId),
        eq(comments.status, "approved"),
        isNull(comments.parentId),
      ),
    )

  const totalRoots = totalResult.count
  const totalPages = Math.max(1, Math.ceil(totalRoots / COMMENTS_PER_PAGE))
  const currentPage = Math.min(safePage, totalPages)

  // Fetch root comments for this page
  const rootComments = await db
    .select({
      id: comments.id,
      body: comments.body,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: user.name,
      userImage: user.image,
    })
    .from(comments)
    .leftJoin(user, eq(comments.userId, user.id))
    .where(
      and(
        eq(comments.productId, productId),
        eq(comments.status, "approved"),
        isNull(comments.parentId),
      ),
    )
    .orderBy(desc(comments.createdAt))
    .limit(COMMENTS_PER_PAGE)
    .offset((currentPage - 1) * COMMENTS_PER_PAGE)

  const rootIds = rootComments.map((c) => c.id)

  // Fetch replies for visible roots only (single SQL query with inArray)
  let replies: typeof rootComments = []
  if (rootIds.length > 0) {
    replies = await db
      .select({
        id: comments.id,
        body: comments.body,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        userId: comments.userId,
        userName: user.name,
        userImage: user.image,
      })
      .from(comments)
      .leftJoin(user, eq(comments.userId, user.id))
      .where(
        and(
          eq(comments.productId, productId),
          eq(comments.status, "approved"),
          inArray(comments.parentId, rootIds),
        ),
      )
      .orderBy(comments.createdAt)
  }

  const allComments = [...rootComments, ...replies]

  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <CommentList
      comments={allComments.map((c) => ({
        id: c.id,
        body: c.body,
        parentId: c.parentId ?? null,
        userId: c.userId,
        userName: c.userName ?? "Anonymous",
        userImage: c.userImage ?? null,
        createdAt: c.createdAt.toISOString(),
      }))}
      productId={productId}
      slug={slug}
      sessionUserId={session?.user.id ?? null}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  )
}
