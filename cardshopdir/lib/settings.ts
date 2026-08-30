import "server-only"

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import { SETTINGS_DEFINITION, type SettingKey } from "./settings-shared"

// Re-export shared types/definitions so server code can import from one place
export {
  SETTINGS_DEFINITION,
  SETTINGS_GROUPS,
  type SettingKey,
} from "./settings-shared"

// ── Cached getter ───────────────────────────────────────────────────────────
// unstable_cache: cross-request persistence, tagged for on-demand revalidation.
// React.cache: per-request dedup (layout + page + metadata = 1 DB hit max).

async function fetchAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings)
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value
  return map
}

const getCachedSettings = unstable_cache(fetchAllSettings, ["site-settings"], {
  tags: ["site-settings"],
})

export const getSettings = cache(
  async (): Promise<Record<SettingKey, string>> => {
    const stored = await getCachedSettings()
    const result = {} as Record<SettingKey, string>
    for (const [key, def] of Object.entries(SETTINGS_DEFINITION)) {
      result[key as SettingKey] = stored[key] ?? def.default
    }
    return result
  }
)

export async function getSetting(key: SettingKey): Promise<string> {
  const all = await getSettings()
  return all[key]
}

export async function getSettingNumber(key: SettingKey): Promise<number> {
  const val = await getSetting(key)
  return Number(val) || 0
}

// ── Typed settings ──────────────────────────────────────────────────────────

export async function getSettingsTyped() {
  const s = await getSettings()
  return {
    siteName: s.site_name,
    siteTagline: s.site_tagline,
    siteDescription: s.site_description,
    shopsPerPage: Number(s.shops_per_page),
    featuredShopsCount: Number(s.featured_shops_count),
    contactEmail: s.contact_email,
    twitterHandle: s.twitter_handle,
    fontSans: s.font_sans,
    fontSerif: s.font_serif,
  }
}

// ── Setter (writes to DB, caller must revalidate) ───────────────────────────

export async function updateSettings(
  updates: Partial<Record<SettingKey, string>>
) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return

  await db.transaction(async (tx) => {
    const now = new Date()
    for (const [key, value] of entries) {
      await tx
        .insert(siteSettings)
        .values({ key, value: value!, updatedAt: now })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: value!, updatedAt: now },
        })
    }
  })
}
