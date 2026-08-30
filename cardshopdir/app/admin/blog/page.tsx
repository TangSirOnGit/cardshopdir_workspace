import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { desc, sql } from "drizzle-orm"
import Link from "next/link"
import { format } from "date-fns"
import { FileText, Plus } from "lucide-react"

export const metadata = { title: "Blog - Admin" }

export default async function AdminBlogPage() {
  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${posts.status} = 'published')::int`,
      drafts: sql<number>`count(*) filter (where ${posts.status} = 'draft')::int`,
    })
    .from(posts)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Blog posts</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {stats.total} total · {stats.published} published ·{" "}
            {stats.drafts} draft{stats.drafts === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          <Plus className="h-3.5 w-3.5" />
          New post
        </Link>
      </div>

      {allPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">No posts yet</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Create your first blog post to get started.
          </p>
          <Link
            href="/admin/blog/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
          >
            <Plus className="h-3.5 w-3.5" />
            New post
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          {allPosts.map((post) => (
            <Link
              key={post.id}
              href={`/admin/blog/${post.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{post.title}</p>
                {post.excerpt && (
                  <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                <span
                  className={
                    post.status === "published"
                      ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                      : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  }
                >
                  <span
                    className={
                      post.status === "published"
                        ? "h-1 w-1 rounded-full bg-emerald-500"
                        : "h-1 w-1 rounded-full bg-muted-foreground/60"
                    }
                  />
                  {post.status}
                </span>
                <span className="hidden text-[12px] tabular-nums text-muted-foreground/60 sm:inline">
                  {format(
                    post.publishedAt ?? post.createdAt,
                    "MMM d, yyyy",
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
