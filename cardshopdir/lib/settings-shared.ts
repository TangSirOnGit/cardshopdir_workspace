// Settings definitions — safe to import from both server and client code.
// Does NOT import DB, cache, or any server-only module.

export const SETTINGS_DEFINITION = {
  // ── General ──────────────────────────────────────────────────
  site_name: {
    default: "CardShopDir",
    type: "string" as const,
    label: "Site name",
    description: "Displayed in the header, emails, and metadata.",
    group: "general",
  },
  site_tagline: {
    default: "Find trading card shops near you.",
    type: "string" as const,
    label: "Tagline",
    description: "Shown on the homepage hero section.",
    group: "general",
  },
  site_description: {
    default:
      "Find trading card shops near you. Browse by state, city, and game.",
    type: "string" as const,
    label: "Meta description",
    description: "Default description for SEO and social sharing.",
    group: "general",
  },
  contact_email: {
    default: "",
    type: "string" as const,
    label: "Contact email",
    description:
      "Public contact address shown in the footer, legal pages, and used as sender for transactional emails.",
    group: "general",
  },

  // ── Directory ────────────────────────────────────────────────
  shops_per_page: {
    default: "24",
    type: "number" as const,
    label: "Shops per page",
    description: "Number of shops shown per page in directory listings.",
    group: "directory",
  },
  featured_shops_count: {
    default: "12",
    type: "number" as const,
    label: "Featured shops",
    description: "Number of featured shops on the homepage.",
    group: "directory",
  },

  // ── SEO & Social ─────────────────────────────────────────────
  twitter_handle: {
    default: "",
    type: "string" as const,
    label: "X / Twitter handle",
    description: "Your X handle (without @) for social cards.",
    group: "seo",
  },

  // ── Appearance ───────────────────────────────────────────────
  font_sans: {
    default: "inter",
    type: "string" as const,
    label: "Body font",
    description: "Sans-serif font used for body text and UI.",
    group: "appearance",
  },
  font_serif: {
    default: "instrument-serif",
    type: "string" as const,
    label: "Heading font",
    description: "Serif font used for page titles and branding.",
    group: "appearance",
  },
} as const

export type SettingKey = keyof typeof SETTINGS_DEFINITION

// ── Shared validation (runs client-side in the form AND server-side in the action)

const VALID_KEYS = new Set(Object.keys(SETTINGS_DEFINITION))

/** Strip unknown keys — prevents arbitrary DB inserts from a crafted request. */
export function filterValidKeys(
  data: Record<string, string>
): Partial<Record<SettingKey, string>> {
  const result: Partial<Record<SettingKey, string>> = {}
  for (const [k, v] of Object.entries(data)) {
    if (VALID_KEYS.has(k)) result[k as SettingKey] = v
  }
  return result
}

/** Validate DB-format values. Returns an array of error messages (empty = valid). */
export function validateSettings(
  data: Partial<Record<SettingKey, string>>
): string[] {
  const errors: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    const def = SETTINGS_DEFINITION[key as SettingKey]
    if (!def) continue

    if (def.type === "number") {
      const num = Number(value)
      if (value.trim() === "" || isNaN(num)) {
        errors.push(`${def.label} must be a valid number.`)
        continue
      }
      if (num < 0) {
        errors.push(`${def.label} cannot be negative.`)
      }
    }

    if (key === "contact_email" && value !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push("Contact email must be a valid email address.")
      }
    }
  }

  return errors
}

export const SETTINGS_GROUPS = [
  {
    id: "general",
    label: "General",
    description: "Site identity and branding.",
  },
  {
    id: "directory",
    label: "Directory",
    description: "Directory listing configuration.",
  },
  {
    id: "seo",
    label: "SEO & Social",
    description: "Search engine and social media defaults.",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Fonts and visual identity.",
  },
] as const
