import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { SubmitForm } from "./submit-form"
import { findNextAvailableWeek, formatLaunchDate, getMondayOfWeek } from "@/lib/schedule"
import { getSettingsTyped } from "@/lib/settings"

export default async function SubmitPage() {
  const [session, freeSlot, boostSlot, settings] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    findNextAvailableWeek("free"),
    findNextAvailableWeek("boost"),
    getSettingsTyped(),
  ])

  const boostPrice = `$${(settings.boostPriceCents / 100).toFixed(0)}`
  const highlightPrice = `$${(settings.highlightPriceCents / 100).toFixed(0)}`

  const freeLaunchDate = formatLaunchDate(freeSlot.week, freeSlot.year)
  const boostLaunchDate = formatLaunchDate(boostSlot.week, boostSlot.year)

  // Calculate wait in days for the free tier
  const now = new Date()
  const freeMonday = getMondayOfWeek(freeSlot.week, freeSlot.year)
  const freeWaitDays = Math.max(1, Math.ceil((freeMonday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))

  // Fetch user's draft submissions so they can complete payment
  const drafts = session?.user
    ? await db
        .select({
          id: submissions.id,
          name: submissions.name,
          tier: submissions.tier,
          thumbnailUrl: submissions.thumbnailUrl,
        })
        .from(submissions)
        .where(
          and(
            eq(submissions.userId, session.user.id),
            eq(submissions.status, "draft"),
          ),
        )
        .orderBy(desc(submissions.createdAt))
    : []

  return (
    <SubmitForm
      freeLaunchDate={freeLaunchDate}
      boostLaunchDate={boostLaunchDate}
      freeWaitDays={freeWaitDays}
      boostPrice={boostPrice}
      highlightPrice={highlightPrice}
      user={session?.user ? { name: session.user.name } : null}
      drafts={drafts}
    />
  )
}
