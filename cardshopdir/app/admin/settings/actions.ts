"use server"

import { requireAdmin } from "@/lib/admin"
import { updateSettings } from "@/lib/settings"
import { filterValidKeys, validateSettings } from "@/lib/settings-shared"
import { revalidateTag, revalidatePath } from "next/cache"

export async function saveSettings(data: Record<string, string>) {
  await requireAdmin()

  // Strip unknown keys — prevents arbitrary DB inserts
  const filtered = filterValidKeys(data)

  // Validate values server-side (never trust client-only validation)
  const errors = validateSettings(filtered)
  if (errors.length > 0) {
    throw new Error(errors[0])
  }

  await updateSettings(filtered)
  revalidateTag("site-settings", "default")
  revalidatePath("/", "layout")
  return { ok: true }
}
