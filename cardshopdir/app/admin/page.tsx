import { db } from "@/lib/db"
import { shops, games, user } from "@/lib/db/schema"
import { count } from "drizzle-orm"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [shopCount] = await db.select({ count: count() }).from(shops)
  const [gameCount] = await db.select({ count: count() }).from(games)
  const [userCount] = await db.select({ count: count() }).from(user)

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-3xl font-bold">{shopCount.count}</div>
          <div className="text-sm text-neutral-500">Shops</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-3xl font-bold">{gameCount.count}</div>
          <div className="text-sm text-neutral-500">Games</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-3xl font-bold">{userCount.count}</div>
          <div className="text-sm text-neutral-500">Users</div>
        </div>
      </div>
      <p className="mt-6 text-sm text-neutral-500">
        Full admin panel coming in Phase 4.
      </p>
    </div>
  )
}
