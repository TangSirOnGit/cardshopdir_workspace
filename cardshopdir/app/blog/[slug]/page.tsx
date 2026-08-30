import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { and, desc, eq, ne } from "drizzle-orm"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Clock } from "lucide-react"
import { SITE_URL } from "@/config"
import { getSetting } from "@/lib/settings"
import type { Metadata } from "next"
import sanitizeHtml from "sanitize-html"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const allPosts = await db.query.posts.findMany({
    columns: { slug: true },
    where: (posts, { eq }) => eq(posts.status, "published"),
  })
  return allPosts.map((p) => ({ slug: p.slug }))
}

function estimateReadingTime(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const words = text ? text.split(" ").length : 0
  return Math.max(1, Math.round(words / 220))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [post, siteName] = await Promise.all([
    db.query.posts.findFirst({
      where: eq(posts.slug, slug),
      columns: { title: true, excerpt: true, imageUrl: true },
    }),
    getSetting("site_name"),
  ])

  if (!post) return {}

  return {
    title: `${post.title} - ${siteName}`,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.imageUrl ? [post.imageUrl] : undefined,
      type: "article",
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const SITE_NAME = await getSetting("site_name")

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: { author: { columns: { name: true, image: true } } },
  })

  if (!post || post.status !== "published") notFound()

  const safeContent = sanitizeHtml(post.content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "a",
      "code",
      "pre",
      "img",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "colgroup",
      "col",
      "figure",
      "figcaption",
      "kbd",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      h2: ["id"],
      h3: ["id"],
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

  const readingTime = estimateReadingTime(post.content)

  const morePosts = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(and(eq(posts.status, "published"), ne(posts.id, post.id)))
    .orderBy(desc(posts.publishedAt))
    .limit(3)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt ?? undefined,
        image: post.imageUrl ?? undefined,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: {
          "@type": "Person",
          name: post.author.name,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}/blog`,
          },
          { "@type": "ListItem", position: 3, name: post.title },
        ],
      },
    ],
  }

  return (
    <div className="py-6">
      <article className="mx-auto w-full max-w-184 min-w-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All posts
        </Link>

        {post.imageUrl && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 sm:aspect-21/9">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="(min-width: 1280px) 736px, (min-width: 768px) 80vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
            Article
          </p>
          <h1 className="mt-3 text-[28px] leading-[1.1] font-semibold tracking-tight text-balance sm:text-[34px] lg:text-[38px]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-[16px] leading-relaxed text-balance text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/60 pt-5 text-[12.5px]">
            <div className="flex items-center gap-2.5">
              {post.author.image ? (
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  width={28}
                  height={28}
                  className="rounded-full ring-1 ring-border"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold ring-1 ring-border">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-foreground">
                  {post.author.name}
                </span>
                <time className="text-[11px] text-muted-foreground tabular-nums">
                  {format(post.publishedAt ?? post.createdAt, "MMMM d, yyyy")}
                </time>
              </div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground tabular-nums">
              <Clock className="h-3 w-3" />
              {readingTime} min read
            </span>
          </div>
        </header>

        <div
          className="prose-description"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        {morePosts.length > 0 && (
          <section className="mt-14">
            <h2 className="text-sm font-semibold tracking-tight">
              Keep reading
            </h2>
            <ul className="mt-4 divide-y divide-border/60">
              {morePosts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group flex items-start justify-between gap-4 py-4 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] leading-snug font-semibold tracking-tight text-balance transition-colors group-hover:text-muted-foreground">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground">
                          {p.excerpt}
                        </p>
                      )}
                      <time className="mt-1.5 block text-[11px] text-muted-foreground/60 tabular-nums">
                        {format(p.publishedAt ?? p.createdAt, "MMM d, yyyy")}
                      </time>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
