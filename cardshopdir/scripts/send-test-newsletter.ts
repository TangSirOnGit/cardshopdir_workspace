import "dotenv/config"
import { render } from "@react-email/components"
import WeeklyNewsletterEmail from "../emails/weekly-newsletter"
import { plunk } from "../lib/plunk"
import { db } from "../lib/db"
import { products } from "../lib/db/schema"
import { desc } from "drizzle-orm"

async function main() {
  // Grab real products with thumbnails for realistic test
  const realProducts = await db.query.products.findMany({
    orderBy: desc(products.voteCount),
    limit: 5,
  })

  const testProducts = realProducts.length > 0
    ? realProducts.map((p) => ({
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        tier: p.tier,
        thumbnailUrl: p.thumbnailUrl,
      }))
    : [
        { name: "Example Boost", slug: "example-boost", tagline: "The best tool for builders", tier: "boost", thumbnailUrl: null },
        { name: "Cool SaaS", slug: "cool-saas", tagline: "Ship faster, build better", tier: "free", thumbnailUrl: null },
        { name: "Featured Tool", slug: "featured-tool", tagline: "Premium launch partner", tier: "highlight", thumbnailUrl: null },
      ]

  const html = await render(
    WeeklyNewsletterEmail({
      weekNumber: 13,
      year: 2026,
      products: testProducts,
    }),
  )

  const result = await plunk.emails.send({
    to: process.env.TEST_EMAIL ?? "your@email.com",
    subject: "CardShopDir — test newsletter",
    body: html,
  })

  console.log("Email sent:", result)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
