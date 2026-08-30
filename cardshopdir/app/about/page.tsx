import { db } from "@/lib/db"
import { shops, games } from "@/lib/db/schema"
import { sql, count } from "drizzle-orm"
import { getSettingsTyped } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function AboutPage() {
  const settings = await getSettingsTyped()
  const [shopCount, gameCount, stateCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(shops)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(games)
      .then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(distinct ${shops.state})::int` })
      .from(shops)
      .where(sql`${shops.state} is not null`)
      .then((r) => r[0].count),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <h1 className="font-serif text-3xl tracking-tight">
        About {settings.siteName}
      </h1>

      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          {settings.siteName} is the most comprehensive directory of trading
          card shops in the United States. We help collectors and players find
          local game stores for their favorite TCGs — from Pokemon and Magic:
          The Gathering to Yu-Gi-Oh!, Flesh and Blood, and more.
        </p>
        <p>
          Our directory currently includes{" "}
          <strong className="text-foreground">
            {shopCount.toLocaleString()} shops
          </strong>{" "}
          across{" "}
          <strong className="text-foreground">{stateCount} states</strong>,
          covering{" "}
          <strong className="text-foreground">
            {gameCount} game categories
          </strong>
          . Whether you&rsquo;re looking for a local comic shop, a dedicated
          game store, or a sports card dealer, we&rsquo;ve got you covered.
        </p>
        <p>
          Each shop listing includes location details, contact information,
          opening hours, supported games, ratings, and photos — everything you
          need to plan your next card-hunting trip.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">
            {shopCount.toLocaleString()}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Shops Listed</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{stateCount}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            States Covered
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">{gameCount}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Game Categories
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <h2 className="text-lg font-semibold">Our Mission</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          We believe local game stores are the heart of the TCG community.
          They&rsquo;re where friendships are forged, skills are honed, and
          collections grow. Our goal is to make it easier than ever to discover
          and support these businesses.
        </p>
      </div>
    </div>
  )
}
