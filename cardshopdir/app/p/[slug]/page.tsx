import { ViewTransition } from "react"
import { db } from "@/lib/db"
import { products, batches, votes, comments } from "@/lib/db/schema"
import { eq, and, asc, ne, count } from "drizzle-orm"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { SponsorSlots } from "@/components/sponsor-slot"
import { ProductShareButtons } from "@/components/product-share-buttons"
import { SITE_URL } from "@/config"
import { getSettingsTyped } from "@/lib/settings"
import { appendUtm } from "@/lib/utm"
import { setISOWeek, setISOWeekYear, startOfISOWeek } from "date-fns"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { VoteButton } from "@/components/vote-button"
import sanitizeHtml from "sanitize-html"
import { CommentSection } from "@/components/comment-section"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ cp?: string }>
}

export async function generateStaticParams() {
  const allProducts = await db.query.products.findMany({
    columns: { slug: true },
  })
  return allProducts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [product, settings] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.slug, slug) }),
    getSettingsTyped(),
  ])

  if (!product) return {}

  const rawDesc = product.description
    ? product.description.replace(/<[^>]*>/g, "").trim()
    : null
  const desc = rawDesc
    ? rawDesc.slice(0, 155).trimEnd() + (rawDesc.length > 155 ? "..." : "")
    : product.tagline
      ? `${product.tagline}. Discover ${product.name} on ${settings.siteName}, a directory of trading card shops.`
      : `Discover ${product.name} on ${settings.siteName}, a directory of trading card shops.`

  return {
    title: `${product.name} · ${product.tagline ?? `Launched on ${settings.siteName}`} | ${settings.siteName}`,
    description: desc,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title: product.name,
      description: desc,
      images: product.thumbnailUrl ? [{ url: product.thumbnailUrl, width: 1200, height: 630, alt: product.name }] : undefined,
      type: "website",
    },
  }
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
      {children}
    </p>
  )
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const commentPage = Math.max(1, parseInt(sp.cp ?? "1", 10) || 1)

  const [product, session, settings] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.slug, slug) }),
    auth.api.getSession({ headers: await headers() }),
    getSettingsTyped(),
  ])

  if (!product) notFound()

  const [userVote, batch, commentCountResult] = await Promise.all([
    session
      ? db.query.votes.findFirst({
          where: and(
            eq(votes.userId, session.user.id),
            eq(votes.productId, product.id)
          ),
        })
      : null,
    db.query.batches.findFirst({ where: eq(batches.id, product.batchId) }),
    db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.productId, product.id),
          eq(comments.status, "approved"),
        ),
      )
      .then((r) => r[0]?.count ?? 0),
  ])

  const voted = !!userVote

  const otherProducts = batch
    ? await db.query.products.findMany({
        where: and(eq(products.batchId, batch.id), ne(products.id, product.id)),
        orderBy: asc(products.position),
        limit: settings.relatedProductsLimit,
      })
    : []

  const linkRel = product.dofollow
    ? "noopener noreferrer"
    : "noopener noreferrer nofollow"

  const launchDate = batch
    ? startOfISOWeek(
        setISOWeek(setISOWeekYear(new Date(), batch.year), batch.weekNumber)
      )
    : null

  const outboundUrl = appendUtm(product.websiteUrl)
  const domain = new URL(product.websiteUrl).hostname.replace("www.", "")

  const pageUrl = `${SITE_URL}/p/${slug}`
  const shareText = `Check out ${product.name}${product.tagline ? `: ${product.tagline}` : ""}`

  const tierLabel =
    product.tier === "highlight"
      ? "Featured"
      : product.tier === "boost"
        ? "Boosted"
        : null

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: product.name,
        url: outboundUrl,
        description: product.description || product.tagline || undefined,
        image: product.thumbnailUrl,
        applicationCategory: "WebApplication",
        ...(launchDate && {
          datePublished: launchDate.toISOString().split("T")[0],
        }),
        aggregateRating:
          product.voteCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: Math.min(5, 3 + product.voteCount * 0.1).toFixed(1),
                ratingCount: product.voteCount,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          ...(batch
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: `Week ${batch.weekNumber}, ${batch.year}`,
                  item: `${SITE_URL}/batches/${batch.year}/${batch.weekNumber}`,
                },
                { "@type": "ListItem", position: 3, name: product.name },
              ]
            : [{ "@type": "ListItem", position: 2, name: product.name }]),
        ],
      },
    ],
  }

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back */}
      <ViewTransition enter="slide-up">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>
      </ViewTransition>

      {/* Two-column layout */}
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        {/* Main */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* Thumbnail */}
          <ViewTransition name={`thumbnail-${slug}`} share="thumbnail-morph">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border">
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                fetchPriority="high"
              />
            </div>
          </ViewTransition>

          {/* Product info */}
          <ViewTransition enter="slide-up">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    {product.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={product.logoUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 shrink-0 rounded-lg bg-muted object-contain"
                      />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <h1 className="font-serif text-2xl tracking-tight">
                      {product.name}
                    </h1>
                    {tierLabel && (
                      <span className="shrink-0 rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-background uppercase">
                        {tierLabel}
                      </span>
                    )}
                  </div>
                  {product.tagline && (
                    <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                      {product.tagline}
                    </p>
                  )}
                </div>
              </div>

              {product.description && (
                <div
                  className="prose-description max-w-2xl"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(product.description, {
                      allowedTags: [
                        "p", "br", "strong", "em", "ul", "ol", "li",
                        "h2", "h3", "h4", "blockquote", "a", "code", "pre", "img",
                        "hr", "table", "thead", "tbody", "tr", "th", "td",
                      ],
                      allowedAttributes: {
                        a: ["href", "target", "rel"],
                        img: ["src", "alt", "width", "height"],
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
                    }),
                  }}
                />
              )}

              {/* Mobile actions */}
              <div className="space-y-2.5 pt-1 lg:hidden">
                <a
                  href={outboundUrl}
                  target="_blank"
                  rel={linkRel}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
                >
                  Visit website
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <VoteButton
                  productId={product.id}
                  voted={voted}
                  count={product.voteCount}
                  size="lg"
                />
              </div>

              {/* Meta inline */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[13px] text-muted-foreground">
                <a
                  href={outboundUrl}
                  target="_blank"
                  rel={linkRel}
                  className="transition-colors hover:text-foreground"
                >
                  {domain}
                </a>
                {launchDate && (
                  <>
                    <span className="text-border">&middot;</span>
                    <span>
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(launchDate)}
                    </span>
                  </>
                )}
                {batch && (
                  <>
                    <span className="text-border">&middot;</span>
                    <Link
                      href={`/batches/${batch.year}/${batch.weekNumber}`}
                      className="transition-colors hover:text-foreground"
                    >
                      Week {batch.weekNumber}, {batch.year}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </ViewTransition>

          {/* Comments */}
          <CommentSection productId={product.id} slug={slug} page={commentPage} totalCount={commentCountResult} />

          {/* Also launched this week */}
          {otherProducts.length > 0 && (
            <ViewTransition enter="slide-up">
              <div className="space-y-4">
                <SidebarLabel>Also launched this week</SidebarLabel>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                  {otherProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/p/${p.slug}`}
                      className="group -mx-2 flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                    >
                      {p.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.logoUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 shrink-0 rounded-lg bg-muted object-contain"
                        />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate text-[13px] font-semibold">
                          {p.name}
                        </span>
                        {p.tagline && (
                          <span className="truncate text-[12px] text-muted-foreground">
                            {p.tagline}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </ViewTransition>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex shrink-0 flex-col space-y-8 lg:sticky lg:top-20 lg:w-64 lg:self-start">
          {/* Actions — desktop only */}
          <div className="hidden space-y-2.5 lg:block">
            <a
              href={outboundUrl}
              target="_blank"
              rel={linkRel}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              Visit website
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <VoteButton
              productId={product.id}
              voted={voted}
              count={product.voteCount}
              size="lg"
            />
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            <SidebarLabel>Details</SidebarLabel>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Website</span>
                <a
                  href={outboundUrl}
                  target="_blank"
                  rel={linkRel}
                  className="truncate pl-4 text-right transition-colors hover:text-muted-foreground"
                >
                  {domain}
                </a>
              </div>
              {launchDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Launched</span>
                  <span>
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(launchDate)}
                  </span>
                </div>
              )}
              {batch && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Batch</span>
                  <Link
                    href={`/batches/${batch.year}/${batch.weekNumber}`}
                    className="transition-colors hover:text-muted-foreground"
                  >
                    Week {batch.weekNumber}, {batch.year}
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Votes</span>
                <span className="tabular-nums">{product.voteCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span className="tabular-nums">{commentCountResult}</span>
              </div>
              {tierLabel && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tier</span>
                  <span>{tierLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Share */}
          <div className="space-y-2.5">
            <SidebarLabel>Share</SidebarLabel>
            <ProductShareButtons title={shareText} url={pageUrl} />
          </div>

          {/* Sponsors */}
          <div className="space-y-2.5">
            <SidebarLabel>Sponsors</SidebarLabel>
            <SponsorSlots />
          </div>
        </aside>
      </div>
    </div>
  )
}
