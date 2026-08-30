"use server"

import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, lte, gte, ne } from "drizzle-orm"
import { getSettingNumber } from "@/lib/settings"

async function findAvailableSlot(
  startDate: string,
  endDate: string,
  excludeId?: number,
) {
  const sponsorSlotCount = await getSettingNumber("sponsor_slot_count")
  for (let slot = 1; slot <= sponsorSlotCount; slot++) {
    const conditions = [
      eq(sponsors.slot, slot),
      lte(sponsors.startsAt, endDate),
      gte(sponsors.endsAt, startDate),
    ]
    if (excludeId) conditions.push(ne(sponsors.id, excludeId))

    const overlapping = await db
      .select({ id: sponsors.id })
      .from(sponsors)
      .where(and(...conditions))
      .limit(1)

    if (overlapping.length === 0) return slot
  }
  return null
}

interface SponsorData {
  name: string
  tagline: string
  websiteUrl: string
  email: string
  imageUrl: string
  startsAt: string
  endsAt: string
}

function validateData(data: SponsorData) {
  if (!data.name.trim() || !data.websiteUrl.trim() || !data.email.trim()) {
    throw new Error("Name, website URL, and email are required")
  }
  if (!data.startsAt || !data.endsAt || data.startsAt > data.endsAt) {
    throw new Error("Invalid date range")
  }
}

export async function createManualSponsor(data: SponsorData) {
  await requireAdmin()
  validateData(data)

  const slot = await findAvailableSlot(data.startsAt, data.endsAt)
  if (!slot) throw new Error("No slots available for the selected dates")

  await db.insert(sponsors).values({
    slot,
    name: data.name.trim(),
    tagline: data.tagline.trim(),
    websiteUrl: data.websiteUrl.trim(),
    imageUrl: data.imageUrl.trim() || null,
    email: data.email.trim(),
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    totalCents: 0,
    stripeSessionId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  })

  revalidatePath("/admin/sponsors")
  revalidatePath("/")
  redirect("/admin/sponsors")
}

export async function updateSponsor(id: number, data: SponsorData) {
  await requireAdmin()
  validateData(data)

  const existing = await db.query.sponsors.findFirst({
    where: eq(sponsors.id, id),
    columns: { slot: true },
  })
  if (!existing) throw new Error("Sponsor not found")

  const datesChanged =
    data.startsAt !== data.startsAt || data.endsAt !== data.endsAt
  let slot = existing.slot

  if (datesChanged) {
    const available = await findAvailableSlot(data.startsAt, data.endsAt, id)
    if (!available) throw new Error("No slots available for the selected dates")
    slot = available
  }

  await db
    .update(sponsors)
    .set({
      slot,
      name: data.name.trim(),
      tagline: data.tagline.trim(),
      websiteUrl: data.websiteUrl.trim(),
      imageUrl: data.imageUrl.trim() || null,
      email: data.email.trim(),
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    })
    .where(eq(sponsors.id, id))

  revalidatePath("/admin/sponsors")
  revalidatePath("/")
}

export async function deleteSponsor(id: number) {
  await requireAdmin()

  await db.delete(sponsors).where(eq(sponsors.id, id))

  revalidatePath("/admin/sponsors")
  revalidatePath("/")
  redirect("/admin/sponsors")
}
