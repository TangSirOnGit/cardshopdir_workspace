import { db } from "./index"
import {
  batches,
  products,
  user,
  submissions,
  posts,
  comments,
  siteSettings,
} from "./schema"
import { getISOWeek, getISOWeekYear, subWeeks, subDays } from "date-fns"

const now = new Date()
const currentWeek = getISOWeek(now)
const currentYear = getISOWeekYear(now)

const TEST_EMAIL = process.env.TEST_EMAIL || "admin@example.com"

// ── Products with realistic descriptions ─────────────────────────────────────

function logo(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

const WEEK_CURRENT = [
  {
    name: "Raycast",
    slug: "raycast",
    tagline: "Your shortcut to everything",
    description:
      "<p>Raycast is a blazingly fast, totally extendable launcher. It lets you complete tasks, calculate, share common links, and much more.</p><p>Built for developers who value <strong>speed</strong> and keyboard-first workflows.</p>",
    websiteUrl: "https://raycast.com",
    thumbnailUrl: "https://picsum.photos/seed/raycast/1280/720",
    logoUrl: logo("raycast.com"),
  },
  {
    name: "Linear",
    slug: "linear",
    tagline: "The issue tracker you'll enjoy using",
    description:
      "<p>Linear is the project management tool built for modern software teams. Streamline issues, sprints, and product roadmaps with a <strong>fast, keyboard-driven</strong> interface that developers love.</p>",
    websiteUrl: "https://linear.app",
    thumbnailUrl: "https://picsum.photos/seed/linear/1280/720",
    logoUrl: logo("linear.app"),
  },
  {
    name: "Resend",
    slug: "resend",
    tagline: "Email for developers",
    description:
      "<p>The best API to reach humans instead of spam folders. Resend is the email-sending platform built from the ground up for developers, with <strong>React Email</strong> support and deliverability you can trust.</p>",
    websiteUrl: "https://resend.com",
    thumbnailUrl: "https://picsum.photos/seed/resend/1280/720",
    logoUrl: logo("resend.com"),
  },
  {
    name: "Cursor",
    slug: "cursor",
    tagline: "The AI code editor",
    description:
      "<p>Cursor is an AI-first code editor built on VS Code. It helps you write, edit, and understand code faster with integrated AI that understands your <em>entire</em> codebase.</p>",
    websiteUrl: "https://cursor.sh",
    thumbnailUrl: "https://picsum.photos/seed/cursor/1280/720",
    logoUrl: logo("cursor.sh"),
  },
  {
    name: "Framer",
    slug: "framer",
    tagline: "Ship sites, fast",
    description:
      "<p>Design and publish stunning websites directly from your browser. Framer combines a powerful visual editor with production-grade hosting and CMS capabilities.</p>",
    websiteUrl: "https://framer.com",
    thumbnailUrl: "https://picsum.photos/seed/framer/1280/720",
    logoUrl: logo("framer.com"),
  },
  {
    name: "Vercel",
    slug: "vercel",
    tagline: "Develop. Preview. Ship.",
    description:
      "<p>Vercel is the frontend cloud. Build, scale, and secure a faster, more personalized web with the framework-defined infrastructure that powers the best of the web.</p>",
    websiteUrl: "https://vercel.com",
    thumbnailUrl: "https://picsum.photos/seed/vercel/1280/720",
    logoUrl: logo("vercel.com"),
  },
  {
    name: "Supabase",
    slug: "supabase",
    tagline: "The open source Firebase alternative",
    description:
      "<p>Build production-grade applications with a Postgres database, authentication, instant APIs, edge functions, realtime subscriptions, storage, and vector embeddings.</p>",
    websiteUrl: "https://supabase.com",
    thumbnailUrl: "https://picsum.photos/seed/supabase/1280/720",
    logoUrl: logo("supabase.com"),
  },
  {
    name: "Cal.com",
    slug: "calcom",
    tagline: "Scheduling infrastructure for everyone",
    description:
      "<p>The open-source Calendly alternative. Cal.com provides scheduling infrastructure that is open, flexible, and self-hostable.</p><p>Manage availability, bookings, and team scheduling.</p>",
    websiteUrl: "https://cal.com",
    thumbnailUrl: "https://picsum.photos/seed/calcom/1280/720",
    logoUrl: logo("cal.com"),
  },
  {
    name: "Dub",
    slug: "dub",
    tagline: "Open-source link management",
    description:
      "<p>Dub is an open-source link management platform for modern marketing teams. Create short links, QR codes, and track analytics with a beautiful dashboard.</p>",
    websiteUrl: "https://dub.co",
    thumbnailUrl: "https://picsum.photos/seed/dub/1280/720",
    logoUrl: logo("dub.co"),
  },
]

const WEEK_PREV_1 = [
  {
    name: "Clerk",
    slug: "clerk",
    tagline: "Authentication and user management",
    description:
      "<p>Drop-in authentication with a complete user management dashboard. Clerk handles sign-up, sign-in, multi-factor auth, organizations, and session management out of the box.</p>",
    websiteUrl: "https://clerk.com",
    thumbnailUrl: "https://picsum.photos/seed/clerk/1280/720",
    logoUrl: logo("clerk.com"),
  },
  {
    name: "Neon",
    slug: "neon",
    tagline: "Serverless Postgres",
    description:
      "<p>Neon is a fully managed serverless Postgres. Scale to zero, branch your database like code, and get a generous free tier with autoscaling built in.</p>",
    websiteUrl: "https://neon.tech",
    thumbnailUrl: "https://picsum.photos/seed/neon/1280/720",
    logoUrl: logo("neon.tech"),
  },
  {
    name: "Convex",
    slug: "convex",
    tagline: "The reactive backend for builders",
    description:
      "<p>Convex is a full-stack TypeScript backend with real-time sync, ACID transactions, and scheduled jobs. Skip the boilerplate and build reactive apps faster.</p>",
    websiteUrl: "https://convex.dev",
    thumbnailUrl: "https://picsum.photos/seed/convex/1280/720",
    logoUrl: logo("convex.dev"),
  },
  {
    name: "Trigger.dev",
    slug: "trigger-dev",
    tagline: "Background jobs for modern apps",
    description:
      "<p>Write long-running background jobs in TypeScript with full observability. Trigger.dev handles retries, scheduling, and logging so you can focus on logic.</p>",
    websiteUrl: "https://trigger.dev",
    thumbnailUrl: "https://picsum.photos/seed/triggerdev/1280/720",
    logoUrl: logo("trigger.dev"),
  },
  {
    name: "Mintlify",
    slug: "mintlify",
    tagline: "Beautiful docs that convert",
    description:
      "<p>Create documentation that drives adoption. Mintlify generates beautiful docs from your code, with built-in analytics and a writing experience developers love.</p>",
    websiteUrl: "https://mintlify.com",
    thumbnailUrl: "https://picsum.photos/seed/mintlify/1280/720",
    logoUrl: logo("mintlify.com"),
  },
  {
    name: "Loops",
    slug: "loops",
    tagline: "Email for SaaS companies",
    description:
      "<p>The email platform purpose-built for SaaS. Loops makes it easy to send transactional, marketing, and product emails with event-based automation and beautiful templates.</p>",
    websiteUrl: "https://loops.so",
    thumbnailUrl: "https://picsum.photos/seed/loops/1280/720",
    logoUrl: logo("loops.so"),
  },
]

const WEEK_PREV_2 = [
  {
    name: "Polar",
    slug: "polar",
    tagline: "Monetize your open source",
    description:
      "<p>Polar helps open-source maintainers get paid for their work. Set up sponsorships, issue funding, and subscriptions with a few clicks.</p>",
    websiteUrl: "https://polar.sh",
    thumbnailUrl: "https://picsum.photos/seed/polar/1280/720",
    logoUrl: logo("polar.sh"),
  },
  {
    name: "Unkey",
    slug: "unkey",
    tagline: "API key management at scale",
    description:
      "<p>Unkey provides API key authentication and authorization. Create, revoke, and rate-limit API keys with a simple REST API and dashboard.</p>",
    websiteUrl: "https://unkey.dev",
    thumbnailUrl: "https://picsum.photos/seed/unkey/1280/720",
    logoUrl: logo("unkey.dev"),
  },
  {
    name: "Inngest",
    slug: "inngest",
    tagline: "Durable workflows for TypeScript",
    description:
      "<p>Build reliable, serverless workflows with TypeScript. Inngest handles retries, scheduling, and orchestration for event-driven applications.</p>",
    websiteUrl: "https://inngest.com",
    thumbnailUrl: "https://picsum.photos/seed/inngest/1280/720",
    logoUrl: logo("inngest.com"),
  },
  {
    name: "Upstash",
    slug: "upstash",
    tagline: "Serverless data for developers",
    description:
      "<p>Serverless Redis, Kafka, and QStash. Upstash provides per-request pricing and global replication for data infrastructure that scales automatically.</p>",
    websiteUrl: "https://upstash.com",
    thumbnailUrl: "https://picsum.photos/seed/upstash/1280/720",
    logoUrl: logo("upstash.com"),
  },
  {
    name: "Planetscale",
    slug: "planetscale",
    tagline: "The database for developers",
    description:
      "<p>PlanetScale is a MySQL-compatible serverless database with branching, non-blocking schema changes, and unlimited scalability. Built on Vitess.</p>",
    websiteUrl: "https://planetscale.com",
    thumbnailUrl: "https://picsum.photos/seed/planetscale/1280/720",
    logoUrl: logo("planetscale.com"),
  },
]

// ── Submissions ──────────────────────────────────────────────────────────────

const SUBMISSIONS = [
  {
    name: "Coolify",
    tagline: "Self-hosted Vercel alternative",
    description:
      "<p>An open-source, self-hostable alternative to Heroku, Netlify, and Vercel. Deploy your apps, databases, and services with a single click.</p>",
    websiteUrl: "https://coolify.io",
    thumbnailUrl: "https://picsum.photos/seed/coolify/1280/720",
    logoUrl: logo("coolify.io"),
    tier: "free" as const,
    status: "pending" as const,
  },
  {
    name: "Pocketbase",
    tagline: "Open source backend in 1 file",
    description:
      "<p>Open source backend consisting of embedded database (SQLite) with <strong>realtime subscriptions</strong>, built-in auth management, and a convenient admin dashboard.</p>",
    websiteUrl: "https://pocketbase.io",
    thumbnailUrl: "https://picsum.photos/seed/pocketbase/1280/720",
    logoUrl: logo("pocketbase.io"),
    tier: "free" as const,
    status: "pending" as const,
  },
  {
    name: "Hono",
    tagline: "Fast, lightweight web framework",
    description:
      "<p>Ultrafast web framework for the Edges. Hono works on any JavaScript runtime including Cloudflare Workers, Deno, Bun, and Node.js.</p>",
    websiteUrl: "https://hono.dev",
    thumbnailUrl: "https://picsum.photos/seed/hono/1280/720",
    logoUrl: logo("hono.dev"),
    tier: "boost" as const,
    status: "pending" as const,
    stripeSessionId: "cs_test_fake_boost_hono",
  },
  {
    name: "Drizzle Studio",
    tagline: "Database browser for Drizzle ORM",
    websiteUrl: "https://orm.drizzle.team",
    thumbnailUrl: "https://picsum.photos/seed/drizzle/1280/720",
    logoUrl: logo("orm.drizzle.team"),
    tier: "boost" as const,
    status: "draft" as const,
  },
  {
    name: "Premium Tool",
    tagline: "Highlight tier waiting for payment",
    websiteUrl: "https://example.com/premium",
    thumbnailUrl: "https://picsum.photos/seed/premium/1280/720",
    logoUrl: null,
    tier: "highlight" as const,
    status: "draft" as const,
  },
  {
    name: "ScreenshotFix",
    tagline: "Needs a better screenshot",
    websiteUrl: "https://example.com/fix",
    thumbnailUrl: "https://picsum.photos/seed/fix/400/225",
    logoUrl: null,
    tier: "free" as const,
    status: "revision" as const,
  },
  {
    name: "Already Accepted",
    tagline: "This was already reviewed",
    websiteUrl: "https://example.com/accepted",
    thumbnailUrl: "https://picsum.photos/seed/accepted/1280/720",
    logoUrl: null,
    tier: "free" as const,
    status: "accepted" as const,
  },
  {
    name: "Rejected App",
    tagline: "Did not meet quality standards",
    websiteUrl: "https://example.com/rejected",
    thumbnailUrl: "https://picsum.photos/seed/rejected/1280/720",
    logoUrl: null,
    tier: "free" as const,
    status: "rejected" as const,
  },
]

// ── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  // Idempotency guard: if the DB already has batches, assume the seed ran
  // successfully before and skip. Re-running the seed would otherwise collide
  // with the unique (week_number, year) constraint on `batches`.
  const existingBatches = await db
    .select({ id: batches.id })
    .from(batches)
    .limit(1)
  if (existingBatches.length > 0) {
    console.log(
      "Database already seeded — skipping. To re-seed from scratch, run:",
    )
    console.log("  bun run db:reset && bun run db:push && bun run db:seed")
    process.exit(0)
  }

  // Placeholder author for seeded blog posts, submissions, and comments.
  // Not an admin — the real admin is created later by the customer signing up
  // at /sign-up and running `bun run promote-admin`. This exists only so the
  // seeded demo content has a valid author FK.
  console.log("Creating seed author...")

  const [seedUser] = await db
    .insert(user)
    .values({
      id: "seed-user-1",
      name: "Demo author",
      email: TEST_EMAIL,
      emailVerified: true,
      role: "user",
    })
    .onConflictDoNothing()
    .returning()

  const userId = seedUser?.id ?? "seed-user-1"
  console.log(`  Seed author: ${TEST_EMAIL} (placeholder for demo content)`)

  // Batch 1: two weeks ago
  const twoWeeksAgo = subWeeks(now, 2)
  const w2Week = getISOWeek(twoWeeksAgo)
  const w2Year = getISOWeekYear(twoWeeksAgo)

  console.log(`\nSeeding batch W${w2Week}, ${w2Year} (2 weeks ago)...`)
  const [batch2] = await db
    .insert(batches)
    .values({ weekNumber: w2Week, year: w2Year, publishedAt: twoWeeksAgo })
    .returning()

  for (let i = 0; i < WEEK_PREV_2.length; i++) {
    const p = WEEK_PREV_2[i]
    await db.insert(products).values({
      batchId: batch2.id,
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl,
      logoUrl: p.logoUrl,
      websiteUrl: p.websiteUrl,
      position: i,
      voteCount: Math.floor(Math.random() * 40) + 5,
    })
    console.log(`  + ${p.name}`)
  }

  // Batch 2: last week
  const oneWeekAgo = subWeeks(now, 1)
  const w1Week = getISOWeek(oneWeekAgo)
  const w1Year = getISOWeekYear(oneWeekAgo)

  console.log(`\nSeeding batch W${w1Week}, ${w1Year} (last week)...`)
  const [batch1] = await db
    .insert(batches)
    .values({ weekNumber: w1Week, year: w1Year, publishedAt: oneWeekAgo })
    .returning()

  for (let i = 0; i < WEEK_PREV_1.length; i++) {
    const p = WEEK_PREV_1[i]
    await db.insert(products).values({
      batchId: batch1.id,
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl,
      logoUrl: p.logoUrl,
      websiteUrl: p.websiteUrl,
      position: i,
      voteCount: Math.floor(Math.random() * 30) + 3,
    })
    console.log(`  + ${p.name}`)
  }

  // Batch 3: current week
  console.log(`\nSeeding batch W${currentWeek}, ${currentYear} (current)...`)
  const [batchCurrent] = await db
    .insert(batches)
    .values({ weekNumber: currentWeek, year: currentYear, publishedAt: now })
    .returning()

  for (let i = 0; i < WEEK_CURRENT.length; i++) {
    const p = WEEK_CURRENT[i]
    await db.insert(products).values({
      batchId: batchCurrent.id,
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl,
      logoUrl: p.logoUrl,
      websiteUrl: p.websiteUrl,
      position: i,
      voteCount: Math.floor(Math.random() * 20),
    })
    console.log(`  + ${p.name}`)
  }

  // Submissions
  console.log("\nSeeding test submissions...")
  for (const sub of SUBMISSIONS) {
    await db.insert(submissions).values({
      userId,
      name: sub.name,
      tagline: sub.tagline,
      description: "description" in sub ? sub.description : null,
      websiteUrl: sub.websiteUrl,
      thumbnailUrl: sub.thumbnailUrl,
      logoUrl: sub.logoUrl,
      tier: sub.tier,
      status: sub.status,
      stripeSessionId: "stripeSessionId" in sub ? sub.stripeSessionId : null,
    })
    console.log(`  + [${sub.status.toUpperCase()}] ${sub.name} (${sub.tier})`)
  }

  // Blog posts
  console.log("\nSeeding blog posts...")
  const SHOWCASE_POST_CONTENT = [
    "<p>This is a showcase post demonstrating every block the editor supports: headings, emphasis, links, lists, blockquotes, images, tables, code blocks with syntax highlighting, horizontal rules, and more. Use it as a reference for what your published posts can look like.</p>",

    "<h2>Rich text basics</h2>",
    '<p>You can make text <strong>bold</strong>, <em>italic</em>, or both <strong><em>at the same time</em></strong>. Add <a href="https://nextjs.org">inline links</a> that open in a new tab, drop <code>inline code</code> mid-sentence for technical terms, and highlight key phrases with emphasis.</p>',
    "<p>Paragraphs support long-form writing with comfortable line-height for reading at 15px on desktop and 14px on mobile. The typography is tuned for editorial content, balancing density and whitespace.</p>",

    "<h3>Bullet lists</h3>",
    "<ul><li>Fast global CDN via Cloudflare R2</li><li>Image optimization with <code>sharp</code> (WebP, q80)</li><li>Full-text sanitization with <code>sanitize-html</code></li><li>Syntax highlighting via Shiki dual-theme</li></ul>",

    "<h3>Numbered lists</h3>",
    "<ol><li>Draft your post in the admin editor</li><li>Upload a cover image and any inline images</li><li>Preview, then publish with one click</li><li>Your post appears on <code>/blog</code> and in the RSS feed</li></ol>",

    "<h2>Images</h2>",
    "<p>Inline images stretch to the full content width and are automatically rounded. They work in both light and dark mode.</p>",
    '<img src="https://picsum.photos/seed/showcase-hero/1200/675" alt="Abstract gradient placeholder illustrating the blog image rendering" />',

    "<h2>Tables</h2>",
    "<p>Tables are great for comparisons, pricing, or structured data. The first row is a header:</p>",
    "<table><thead><tr><th>Tier</th><th>Price</th><th>Launch time</th><th>Backlink</th></tr></thead><tbody><tr><td>Free</td><td>$0</td><td>Next available batch</td><td>Top 3 only</td></tr><tr><td>Boost</td><td>$9</td><td>Next batch, priority slot</td><td>Guaranteed dofollow</td></tr><tr><td>Highlight</td><td>$29</td><td>Instant publish, pinned 7 days</td><td>Guaranteed dofollow</td></tr></tbody></table>",

    "<h2>Code blocks</h2>",
    "<p>Code blocks are syntax-highlighted server-side with Shiki using dual themes (<code>github-light</code> and <code>github-dark</code>). A copy button appears in the top-right of every block.</p>",

    "<h3>TypeScript</h3>",
    '<pre><code>import { db } from "@/lib/db"\nimport { posts } from "@/lib/db/schema"\nimport { eq } from "drizzle-orm"\n\nexport async function getPublishedPost(slug: string) {\n  const post = await db.query.posts.findFirst({\n    where: eq(posts.slug, slug),\n    with: { author: { columns: { name: true, image: true } } },\n  })\n\n  if (!post || post.status !== "published") return null\n  return post\n}</code></pre>',

    "<h3>Shell</h3>",
    "<pre><code># Install dependencies and run the dev server\nbun install\nbun run db:start\nbun run db:seed\nbun run dev</code></pre>",

    "<h3>JSON</h3>",
    '<pre><code>{\n  "name": "cardshopdir",\n  "scripts": {\n    "dev": "next dev --turbopack",\n    "build": "next build",\n    "db:seed": "bun run lib/db/seed.ts"\n  }\n}</code></pre>',

    "<h2>Blockquotes</h2>",
    "<blockquote><p>Design is not just what it looks like and feels like. Design is how it works.</p><p>— Steve Jobs</p></blockquote>",

    "<h2>Horizontal rules &amp; structure</h2>",
    "<p>Use a horizontal rule to separate major sections or signal a topic change.</p>",
    "<hr>",

    "<h2>What's next</h2>",
    "<p>Now you have a full reference post. Duplicate it to build your own, or delete it once you're comfortable with the editor. Every element you see here is available from the toolbar.</p>",
    "<p>Happy writing.</p>",
  ].join("")

  const BLOG_POSTS = [
    {
      title: "Editor Showcase: Every Block You Can Use",
      slug: "editor-showcase-every-block-you-can-use",
      excerpt:
        "A full reference post demonstrating headings, lists, images, tables, code blocks, blockquotes, and every other element the blog editor supports.",
      imageUrl: "https://picsum.photos/seed/blog-showcase/1200/600",
      content: SHOWCASE_POST_CONTENT,
      status: "published" as const,
      publishedAt: subDays(now, 15),
    },
    {
      title: "Welcome to CardShopDir",
      slug: "welcome-to-cardshopdir",
      excerpt:
        "Discover how our weekly curated batches help the best new products get noticed.",
      imageUrl: "https://picsum.photos/seed/blog-welcome/1200/600",
      content: [
        "<h2>A new way to launch</h2>",
        "<p>Every Monday, we publish a fresh batch of handpicked products. Our curation process ensures only quality tools make the cut.</p>",
        "<p>Whether you're a maker looking for visibility or a tech enthusiast hunting for the next great tool, this platform is built for you.</p>",
        '<img src="https://picsum.photos/seed/launch-demo/800/400" alt="Platform overview" />',
        "<h3>How it works</h3>",
        "<ol><li><strong>Submit</strong> your product anytime via the submission form</li><li>Our team <strong>reviews</strong> each submission within 48 hours</li><li>Accepted products join the <strong>next weekly batch</strong></li><li>The community <strong>votes and discovers</strong> the best tools</li></ol>",
        "<blockquote><p>Great products deserve a spotlight, not just the ones with the biggest marketing budgets.</p></blockquote>",
        "<h3>Getting started with the API</h3>",
        "<p>If you want to integrate with our platform programmatically, here is a quick example:</p>",
        '<pre><code>const response = await fetch("https://api.cardshopdir.com/v1/shops", {\n  method: "GET",\n  headers: {\n    Authorization: `Bearer ${API_KEY}`,\n    "Content-Type": "application/json",\n  },\n})\n\nconst { products } = await response.json()\nconsole.log(`Found ${products.length} products`)</code></pre>',
        "<p>You can also use the <code>batchId</code> query parameter to filter by week.</p>",
      ].join(""),
      status: "published" as const,
      publishedAt: subDays(now, 12),
    },
    {
      title: "Building a Sponsor System with Stripe",
      slug: "building-a-sponsor-system-with-stripe",
      excerpt:
        "A technical deep-dive into how we built our self-serve sponsorship system with Stripe Checkout and dynamic pricing.",
      imageUrl: "https://picsum.photos/seed/blog-stripe/1200/600",
      content: [
        "<h2>Why we built self-serve sponsoring</h2>",
        "<p>Manual sponsor deals don't scale. We wanted a system where anyone could book a banner slot, pay, and go live without human intervention.</p>",
        '<img src="https://picsum.photos/seed/sponsor-flow/800/400" alt="Sponsor booking flow" />',
        "<h3>Architecture overview</h3>",
        "<p>The system has three core components:</p>",
        "<ul><li><strong>Calendar picker</strong> for date selection with availability checks</li><li><strong>Stripe Checkout</strong> for secure payment processing</li><li><strong>Webhook handler</strong> for automatic activation on payment success</li></ul>",
        "<h3>Dynamic pricing with volume discounts</h3>",
        "<p>We implemented a progressive discount system. The longer the campaign, the better the daily rate:</p>",
        "<pre><code>function calculatePrice(days: number): number {\n  const BASE_PRICE = 300 // $3.00 per day in cents\n  const MAX_DISCOUNT = 0.30\n  const MAX_DAYS = 30\n\n  const ratio = Math.min(days, MAX_DAYS) / MAX_DAYS\n  const discount = ratio * MAX_DISCOUNT\n  const dailyPrice = BASE_PRICE * (1 - discount)\n\n  return Math.round(dailyPrice * days)\n}</code></pre>",
        "<p>A 7-day campaign costs <code>$2.79/day</code> while a 30-day campaign drops to <code>$2.10/day</code>.</p>",
        "<h3>Handling the Stripe webhook</h3>",
        "<p>The webhook endpoint verifies the signature and activates the campaign:</p>",
        '<pre><code>export async function POST(req: Request) {\n  const body = await req.text()\n  const sig = req.headers.get("stripe-signature")!\n\n  const event = stripe.webhooks.constructEvent(\n    body,\n    sig,\n    process.env.STRIPE_WEBHOOK_SECRET!\n  )\n\n  if (event.type === "checkout.session.completed") {\n    const session = event.data.object\n    await activateSponsorCampaign(session.metadata)\n  }\n\n  return new Response("ok")\n}</code></pre>',
        "<blockquote><p>Always verify the webhook signature. Never trust the payload without it.</p></blockquote>",
        "<p>The full source code is available in the template repository.</p>",
      ].join(""),
      status: "published" as const,
      publishedAt: subDays(now, 8),
    },
    {
      title: "Tips for a Successful Product Submission",
      slug: "tips-for-a-successful-product-submission",
      excerpt:
        "Maximize your chances of being featured in the next weekly batch with these practical tips.",
      imageUrl: "https://picsum.photos/seed/blog-tips/1200/600",
      content: [
        "<h2>Make your submission stand out</h2>",
        "<p>We review every submission carefully. Here's what separates accepted products from the rest.</p>",
        '<img src="https://picsum.photos/seed/submission-example/800/400" alt="Example submission" />',
        "<h3>1. Use a high-quality screenshot</h3>",
        "<p>Your thumbnail is the first thing people see. Use a clean, high-resolution screenshot (<code>1280x720</code> recommended) that shows your product in action.</p>",
        "<h3>2. Write a compelling tagline</h3>",
        "<p>Keep it short, specific, and benefit-oriented:</p>",
        "<ul><li><strong>Good:</strong> <em>The open-source Calendly alternative</em></li><li><strong>Bad:</strong> <em>A scheduling tool</em></li></ul>",
        "<h3>3. Add a rich description</h3>",
        "<p>Use the editor to format your description. You can include bold text, links, lists, and code snippets. Here's the markup we support:</p>",
        "<pre><code># Supported formats\n- **Bold** and *italic* text\n- Bullet and numbered lists\n- `Inline code` and code blocks\n- Blockquotes for emphasis\n- Links (all nofollow)</code></pre>",
        "<h3>4. Make sure your site is ready</h3>",
        "<p>We check that your website loads quickly, looks professional, and clearly communicates what your product does. A slow or broken site is an instant rejection.</p>",
        "<blockquote><p>Your landing page is your first impression. Make every pixel count.</p></blockquote>",
      ].join(""),
      status: "published" as const,
      publishedAt: subDays(now, 3),
    },
    {
      title: "How We Handle Image Uploads with R2",
      slug: "how-we-handle-image-uploads-with-r2",
      excerpt:
        "Our image pipeline compresses, resizes, and serves optimized thumbnails through Cloudflare R2.",
      imageUrl: "https://picsum.photos/seed/blog-r2/1200/600",
      content: [
        "<h2>The image pipeline</h2>",
        "<p>Every image uploaded to the platform goes through a processing pipeline before it reaches Cloudflare R2 storage.</p>",
        '<img src="https://picsum.photos/seed/r2-pipeline/800/400" alt="Image processing pipeline" />',
        "<h3>Processing with Sharp</h3>",
        "<p>We use the <code>sharp</code> library to optimize uploads server-side:</p>",
        '<pre><code>import sharp from "sharp"\n\nconst optimized = await sharp(rawBuffer)\n  .resize(1280, 720, {\n    fit: "inside",\n    withoutEnlargement: true,\n  })\n  .webp({ quality: 80, effort: 4 })\n  .toBuffer()\n\nconst key = `thumbnails/${Date.now()}-${id}.webp`\nawait uploadToR2(key, optimized, "image/webp")</code></pre>',
        "<p>This reduces file sizes by <strong>60-80%</strong> on average while maintaining visual quality.</p>",
        "<h3>Local development fallback</h3>",
        "<p>For local development without R2 credentials, the upload API falls back to the filesystem:</p>",
        '<pre><code>async function uploadToR2(key: string, data: Buffer, contentType: string) {\n  if (!process.env.R2_BUCKET) {\n    // Fallback: save to local public directory\n    const path = join(process.cwd(), "public/uploads", key)\n    await mkdir(dirname(path), { recursive: true })\n    await writeFile(path, data)\n    return `/uploads/${key}`\n  }\n\n  // Production: upload to Cloudflare R2\n  await r2.putObject({ Bucket, Key: key, Body: data, ContentType: contentType })\n  return `${CDN_URL}/${key}`\n}</code></pre>',
        "<h3>Accepted formats</h3>",
        "<p>The API accepts three image formats:</p>",
        "<ul><li><code>image/jpeg</code></li><li><code>image/png</code></li><li><code>image/webp</code></li></ul>",
        "<p>All outputs are converted to WebP for optimal performance.</p>",
        "<blockquote><p>Serving optimized images is one of the easiest performance wins you can get.</p></blockquote>",
      ].join(""),
      status: "published" as const,
      publishedAt: subDays(now, 1),
    },
    {
      title: "Upcoming Features and Roadmap",
      slug: "upcoming-features-and-roadmap",
      excerpt: "A sneak peek at what we're building next for the platform.",
      imageUrl: "https://picsum.photos/seed/blog-roadmap/1200/600",
      content: [
        "<h2>What's next</h2>",
        "<p>We're constantly improving the platform based on community feedback. Here's a preview of what's coming.</p>",
        '<img src="https://picsum.photos/seed/roadmap-preview/800/400" alt="Roadmap preview" />',
        "<h3>In progress</h3>",
        "<ul><li>Enhanced product analytics for submitters</li><li>Comment system on product pages</li><li>Weekly digest email with personalized recommendations</li></ul>",
        "<h3>Planned</h3>",
        "<ul><li><strong>API access</strong> for power users and integrations</li><li><strong>Embeddable badges</strong> for featured products</li><li><strong>Multi-language support</strong> for global reach</li></ul>",
        "<h3>Tech stack improvements</h3>",
        "<p>We're also refactoring internals to improve developer experience:</p>",
        '<pre><code>// New config pattern\nimport { SITE_NAME, SITE_URL } from "@/config/site"\nimport { BOOST_PRICE_CENTS } from "@/config/pricing"\nimport { VOTES_PER_WINDOW } from "@/config/limits"</code></pre>',
        "<blockquote><p>Have a feature request? Open an issue on our GitHub repository.</p></blockquote>",
      ].join(""),
      status: "draft" as const,
      publishedAt: null,
    },
  ]

  for (const post of BLOG_POSTS) {
    await db.insert(posts).values({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      imageUrl: post.imageUrl,
      content: post.content,
      status: post.status,
      authorId: userId,
      publishedAt: post.publishedAt,
    })
    console.log(`  + [${post.status.toUpperCase()}] ${post.title}`)
  }

  // Site settings (defaults)
  console.log("\nSeeding site settings...")
  const defaultSettings = [
    { key: "site_name", value: "CardShopDir" },
    { key: "site_tagline", value: "A curated batch of launches, every week." },
    {
      key: "site_description",
      value: "Find trading card shops near you. Browse by state, city, and game.",
    },
    { key: "boost_price_cents", value: "900" },
    { key: "highlight_price_cents", value: "2900" },
    { key: "free_slots_per_batch", value: "9" },
    { key: "sponsor_slot_count", value: "3" },
    { key: "sponsor_base_price_cents", value: "300" },
  ]
  for (const s of defaultSettings) {
    await db
      .insert(siteSettings)
      .values({ key: s.key, value: s.value })
      .onConflictDoNothing()
  }
  console.log(`  ${defaultSettings.length} settings seeded`)

  // Comments on Raycast (first product of current batch)
  console.log("\nSeeding comments on Raycast...")

  const raycast = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.slug, "raycast"),
    columns: { id: true },
  })

  if (raycast) {
    // Create a few fake users for diverse comments
    const commentUsers = [
      { id: "seed-user-2", name: "Sarah Chen", email: "sarah@example.com" },
      { id: "seed-user-3", name: "Marco Rossi", email: "marco@example.com" },
      { id: "seed-user-4", name: "Léa Dupont", email: "lea@example.com" },
      { id: "seed-user-5", name: "Alex Kim", email: "alex@example.com" },
      { id: "seed-user-6", name: "Jordan Blake", email: "jordan@example.com" },
    ]

    for (const u of commentUsers) {
      await db
        .insert(user)
        .values({ ...u, emailVerified: true })
        .onConflictDoNothing()
    }

    const SEED_COMMENTS: { body: string; userId: string; hoursAgo: number; replies?: { body: string; userId: string; hoursAgo: number }[] }[] = [
      {
        body: "Been using Raycast for about a year now. Completely replaced Spotlight for me. The clipboard history alone is worth it.",
        userId: "seed-user-2",
        hoursAgo: 72,
        replies: [
          { body: "Same here! The snippets feature saves me so much time with repetitive emails.", userId: "seed-user-3", hoursAgo: 70 },
          { body: "Clipboard history is great but have you tried the window management? Changed my workflow completely.", userId: "seed-user-5", hoursAgo: 68 },
        ],
      },
      {
        body: "The extension ecosystem is what makes this special. I built a custom extension for our internal tools in a weekend. The API is really well documented.",
        userId: "seed-user-3",
        hoursAgo: 65,
        replies: [
          { body: "Do you have a link to the docs for building extensions? I'd love to try that.", userId: "seed-user-4", hoursAgo: 63 },
          { body: "Check out https://developers.raycast.com — the TypeScript SDK is solid.", userId: "seed-user-3", hoursAgo: 61 },
        ],
      },
      {
        body: "How does this compare to Alfred? I've been an Alfred user for years and I'm curious if it's worth switching.",
        userId: "seed-user-4",
        hoursAgo: 58,
        replies: [
          { body: "I switched from Alfred last month. Raycast feels more modern and the UI is cleaner. Extensions are also easier to install — no need to download workflow files.", userId: "seed-user-2", hoursAgo: 55 },
          { body: "Alfred is still great for power users who want total control. Raycast is better if you want things to \"just work\" out of the box.", userId: "seed-user-6", hoursAgo: 52 },
          { body: "The main advantage of Raycast for me is the built-in AI. I use it daily for quick translations and summaries.", userId: "seed-user-5", hoursAgo: 48 },
        ],
      },
      {
        body: "Just discovered the floating notes feature. Perfect for quick todos during meetings without switching context.",
        userId: "seed-user-5",
        hoursAgo: 45,
      },
      {
        body: "The team behind Raycast is incredibly responsive. I reported a bug on their GitHub and they shipped a fix the next day. That kind of velocity is rare.",
        userId: "seed-user-6",
        hoursAgo: 40,
        replies: [
          { body: "Can confirm. Their Discord community is also really active and helpful.", userId: "seed-user-4", hoursAgo: 38 },
        ],
      },
      {
        body: "One thing I'd love to see is better multi-monitor support. Sometimes the command bar opens on the wrong screen.",
        userId: "seed-user-2",
        hoursAgo: 35,
        replies: [
          { body: "They actually fixed this in the latest update! Make sure you're on v1.70+", userId: "seed-user-6", hoursAgo: 32 },
        ],
      },
      {
        body: "Pro tip: assign a hotkey to the AI chat and you basically have a system-wide ChatGPT that can interact with your clipboard. Game changer.",
        userId: "seed-user-3",
        hoursAgo: 28,
      },
      {
        body: "I recommend Raycast to every developer I meet. It's one of those tools that you don't realize you needed until you try it.",
        userId: "seed-user-4",
        hoursAgo: 24,
      },
      {
        body: "The quicklinks feature is underrated. I have shortcuts for all my frequently used URLs with dynamic parameters. Way faster than bookmarks.",
        userId: "seed-user-5",
        hoursAgo: 20,
        replies: [
          { body: "Can you give an example? I haven't explored quicklinks yet.", userId: userId, hoursAgo: 18 },
          { body: "Sure! I have one like `gh {query}` that opens `github.com/search?q={query}`. Works for Jira tickets, docs, anything.", userId: "seed-user-5", hoursAgo: 16 },
        ],
      },
      {
        body: "Switched my whole team to Raycast last quarter. The shared snippets and quicklinks through the Teams feature made onboarding new devs so much smoother.",
        userId: "seed-user-6",
        hoursAgo: 14,
      },
      {
        body: "Is the Pro plan worth it? I've been on the free tier and it covers most of my needs.",
        userId: userId,
        hoursAgo: 10,
        replies: [
          { body: "If you use the AI features heavily, yes. Otherwise the free tier is genuinely generous.", userId: "seed-user-2", hoursAgo: 8 },
          { body: "I find the cloud sync alone worth it. My setup follows me across machines.", userId: "seed-user-3", hoursAgo: 6 },
        ],
      },
      {
        body: "The confetti animation when you complete a task from the todo list extension made my day. Small details like that show they care about the experience.",
        userId: "seed-user-2",
        hoursAgo: 4,
      },
      {
        body: "Genuinely one of the best developer tools released in the last few years. The speed is unmatched — it feels instant even with hundreds of extensions installed.",
        userId: "seed-user-5",
        hoursAgo: 2,
      },
    ]

    let commentCount = 0
    for (const c of SEED_COMMENTS) {
      const [root] = await db
        .insert(comments)
        .values({
          productId: raycast.id,
          userId: c.userId,
          body: c.body,
          ip: "127.0.0.1",
          createdAt: new Date(Date.now() - c.hoursAgo * 60 * 60 * 1000),
        })
        .returning()
      commentCount++

      if (c.replies) {
        for (const r of c.replies) {
          await db.insert(comments).values({
            productId: raycast.id,
            userId: r.userId,
            parentId: root.id,
            body: r.body,
            ip: "127.0.0.1",
            createdAt: new Date(Date.now() - r.hoursAgo * 60 * 60 * 1000),
          })
          commentCount++
        }
      }
    }
    console.log(`  ${commentCount} comments seeded on Raycast`)
  }

  console.log("\n✓ Seed complete!")
  console.log(
    `\n  3 batches seeded (${WEEK_PREV_2.length + WEEK_PREV_1.length + WEEK_CURRENT.length} products total)`
  )
  console.log(`  ${SUBMISSIONS.length} test submissions`)
  console.log(
    `  ${BLOG_POSTS.length} blog posts (${BLOG_POSTS.filter((p) => p.status === "published").length} published)`
  )
  console.log(
    `\n  Next: sign up at /sign-up, then run:`,
  )
  console.log(`    bun run promote-admin <your-email>`)

  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
