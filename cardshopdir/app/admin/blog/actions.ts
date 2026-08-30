"use server"

import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import sanitizeHtml from "sanitize-html"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "ul", "ol", "li",
      "h2", "h3", "h4", "blockquote", "a", "code", "pre", "img",
      "hr", "table", "thead", "tbody", "tr", "th", "td",
      "colgroup", "col", "figure", "figcaption", "kbd",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      col: ["span"],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
    },
  })
}

interface PostData {
  title: string
  excerpt: string
  content: string
  imageUrl: string
  status: "draft" | "published"
}

export async function createPost(data: PostData) {
  const session = await requireAdmin()

  const slug = slugify(data.title) || `post-${Date.now()}`
  const sanitized = sanitizeContent(data.content)

  const [post] = await db
    .insert(posts)
    .values({
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt.trim() || null,
      content: sanitized,
      imageUrl: data.imageUrl.trim() || null,
      status: data.status,
      authorId: session.user.id,
      publishedAt: data.status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id })

  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  redirect(`/admin/blog/${post.id}`)
}

export async function updatePost(id: number, data: PostData) {
  await requireAdmin()

  const existing = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    columns: { status: true, publishedAt: true },
  })

  const sanitized = sanitizeContent(data.content)
  const isNewlyPublished = data.status === "published" && existing?.status !== "published"

  await db
    .update(posts)
    .set({
      title: data.title.trim(),
      slug: slugify(data.title) || `post-${id}`,
      excerpt: data.excerpt.trim() || null,
      content: sanitized,
      imageUrl: data.imageUrl.trim() || null,
      status: data.status,
      publishedAt: isNewlyPublished ? new Date() : existing?.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))

  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  revalidatePath(`/blog/${slugify(data.title)}`)
}

export async function deletePost(id: number) {
  await requireAdmin()

  await db.delete(posts).where(eq(posts.id, id))
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
  redirect("/admin/blog")
}
