import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PostForm } from "../post-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Edit post - Admin" }

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const postId = parseInt(id, 10)
  if (isNaN(postId)) notFound()

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  })

  if (!post) notFound()

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to posts
      </Link>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Edit post</h1>
      <PostForm post={post} />
    </div>
  )
}
