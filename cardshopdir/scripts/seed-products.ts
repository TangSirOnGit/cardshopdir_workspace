import { db } from "@/lib/db"
import { batches, products } from "@/lib/db/schema"
import { uploadToR2 } from "@/lib/r2"
import { eq, and } from "drizzle-orm"
import { getISOWeek, getISOWeekYear } from "date-fns"
import sharp from "sharp"
import { readFileSync } from "fs"
import { resolve } from "path"

const SEED_PRODUCTS = [
  {
    name: "FontTrio",
    tagline: "Fonts paired for you — install with one command",
    websiteUrl: "https://www.fonttrio.xyz/",
    image: "1.png",
  },
  {
    name: "DataBuddy",
    tagline: "Privacy-first analytics — one script, no cookies, no consent banners",
    websiteUrl: "https://www.databuddy.cc/",
    image: "2.png",
  },
  {
    name: "SlapMac",
    tagline: "Slap your MacBook. It screams back. That's the app.",
    websiteUrl: "https://slapmac.com/",
    image: "3.png",
  },
  {
    name: "Recordly",
    tagline: "Create polished screen recordings in seconds — open source",
    websiteUrl: "https://recordly.dev/",
    image: "4.png",
  },
  {
    name: "Baked Supply",
    tagline: "Copy-paste ready website sections for Figma",
    websiteUrl: "https://www.baked.supply/",
    image: "5.png",
  },
  {
    name: "21st.dev",
    tagline: "The fastest way to ship UI components and AI agents",
    websiteUrl: "https://21st.dev",
    image: "6.png",
  },
  {
    name: "Hugeicons",
    tagline: "51,000+ beautiful icons that make products feel premium",
    websiteUrl: "https://hugeicons.com/",
    image: "7.png",
  },
  {
    name: "Mobbin",
    tagline: "Discover real-world design inspiration from top apps and websites",
    websiteUrl: "https://mobbin.com/",
    image: "8.png",
  },
  {
    name: "Cossistant",
    tagline: "AI agent customer support for your SaaS in under 10 lines of code",
    websiteUrl: "https://cossistant.com/",
    image: "9.png",
  },
]

const MAX_WIDTH = 1280
const MAX_HEIGHT = 720
const WEBP_QUALITY = 80

async function processImage(filename: string): Promise<string> {
  const filePath = resolve(process.cwd(), "public", filename)
  const rawBuffer = readFileSync(filePath)

  const optimized = await sharp(rawBuffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer()

  const key = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
  const url = await uploadToR2(key, optimized, "image/webp")

  console.log(`  Uploaded ${filename} → ${url}`)
  return url
}

async function main() {
  const now = new Date()
  const currentWeek = getISOWeek(now)
  const currentYear = getISOWeekYear(now)

  console.log(`Seeding batch for Week ${currentWeek}, ${currentYear}...\n`)

  // Get or create batch
  let batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.weekNumber, currentWeek),
      eq(batches.year, currentYear),
    ),
  })

  if (!batch) {
    const [newBatch] = await db
      .insert(batches)
      .values({ weekNumber: currentWeek, year: currentYear, publishedAt: now })
      .returning()
    batch = newBatch
    console.log(`Created batch #${batch.id}\n`)
  } else {
    console.log(`Using existing batch #${batch.id}\n`)
  }

  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    const product = SEED_PRODUCTS[i]

    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    // Check slug collision
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    })

    if (existing) {
      console.log(`  ⏭ ${product.name} already exists (slug: ${slug}), skipping`)
      continue
    }

    console.log(`Processing ${product.name}...`)
    const thumbnailUrl = await processImage(product.image)

    await db.insert(products).values({
      batchId: batch.id,
      name: product.name,
      slug,
      tagline: product.tagline,
      thumbnailUrl,
      websiteUrl: product.websiteUrl,
      tier: "free",
      position: i,
      dofollow: false,
    })

    console.log(`  ✓ ${product.name} → /p/${slug}\n`)
  }

  console.log("Done! 9 products seeded.")
  process.exit(0)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
