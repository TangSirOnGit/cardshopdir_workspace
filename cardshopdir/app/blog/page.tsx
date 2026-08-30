import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { count, desc, eq } from "drizzle-orm"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { getSetting } from "@/lib/settings"
import type { Metadata } from "next"
import { createSearchParamsCache, parseAsInteger } from "nuqs/server"
import type { SearchParams } from "nuqs/server"
import { BlogPagination } from "./blog-pagination"

const POSTS_PER_PAGE = 12

const blogParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
})

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting("site_name")
  return {
    title: `Blog - ${siteName}`,
    description: `Latest articles and updates from ${siteName}.`,
    alternates: { canonical: "/blog" },
  }
}

type PostData = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  imageUrl: string | null
  publishedAt: Date | null
  createdAt: Date
}

function FeaturedPostCard({ post }: { post: PostData }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block focus-visible:outline-none"
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10">
        {post.imageUrl && (
          <div className="relative aspect-3/2 overflow-hidden rounded-xl bg-muted ring-1 ring-border/70">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              priority
            />
          </div>
        )}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground/60">
            <span className="inline-flex size-1 rounded-full bg-foreground/60" />
            Featured
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-[1.2] tracking-tight text-balance transition-colors group-hover:text-muted-foreground sm:text-2xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          <time className="mt-4 text-[11px] tabular-nums text-muted-foreground/60">
            {format(post.publishedAt ?? post.createdAt, "MMMM d, yyyy")}
          </time>
        </div>
      </div>
    </Link>
  )
}

function PostCard({ post }: { post: PostData }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block focus-visible:outline-none"
    >
      {post.imageUrl ? (
        <div className="relative aspect-3/2 overflow-hidden rounded-lg bg-muted ring-1 ring-border/70">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="aspect-3/2 rounded-lg bg-muted/60 ring-1 ring-border/70" />
      )}
      <div className="mt-3.5">
        <time className="text-[11px] tabular-nums text-muted-foreground/60">
          {format(post.publishedAt ?? post.createdAt, "MMM d, yyyy")}
        </time>
        <h2 className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-balance transition-colors group-hover:text-muted-foreground">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { page } = await blogParamsCache.parse(searchParams)

  const [totalResult] = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.status, "published"))
  const total = totalResult.count
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const allPagePosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(POSTS_PER_PAGE + (safePage === 1 ? 1 : 0))
    .offset(safePage === 1 ? 0 : (safePage - 1) * POSTS_PER_PAGE + 1)

  const isFirstPage = safePage === 1
  const featured = isFirstPage ? allPagePosts[0] : null
  const gridPosts = isFirstPage ? allPagePosts.slice(1) : allPagePosts

  return (
    <div className="space-y-10 pt-2 sm:pt-4">
      <header className="max-w-2xl">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Blog</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Latest articles, product updates, and behind-the-scenes notes.
        </p>
      </header>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 py-20 text-center">
          <p className="text-sm text-muted-foreground">
            No posts yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-12 sm:space-y-14">
          {featured && <FeaturedPostCard post={featured} />}

          {gridPosts.length > 0 && (
            <>
              {isFirstPage && <div className="h-px w-full bg-border/60" />}
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <BlogPagination page={safePage} totalPages={totalPages} />
          )}
        </div>
      )}
    </div>
  )
}
