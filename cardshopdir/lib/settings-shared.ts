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
    default: "A curated batch of launches, every week.",
    type: "string" as const,
    label: "Tagline",
    description: "Shown on the homepage hero section.",
    group: "general",
  },
  site_description: {
    default: "Find trading card shops near you. Browse by state, city, and game.",
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

  // ── Launch schedule ──────────────────────────────────────────
  launch_day: {
    default: "monday",
    type: "string" as const,
    label: "Launch day",
    description: "Day of the week when batches go live.",
    group: "schedule",
  },
  launch_hour_utc: {
    default: "6",
    type: "number" as const,
    label: "Launch hour (UTC)",
    description: "Hour (0–23 UTC) when the weekly cron publishes the batch.",
    group: "schedule",
  },
  free_slots_per_batch: {
    default: "9",
    type: "number" as const,
    label: "Free slots per batch",
    description: "Maximum free submissions accepted per weekly batch.",
    group: "schedule",
  },
  highlight_duration_days: {
    default: "7",
    type: "number" as const,
    label: "Highlight duration (days)",
    description:
      "How many days a Highlight product stays pinned on the homepage.",
    group: "schedule",
  },
  dofollow_top_n: {
    default: "3",
    type: "number" as const,
    label: "Dofollow top N",
    description:
      "Top N voted products per batch get a permanent dofollow backlink.",
    group: "schedule",
  },

  // ── Pricing ──────────────────────────────────────────────────
  boost_price_cents: {
    default: "900",
    type: "number" as const,
    label: "Boost price",
    description: "Price for a Boost submission.",
    group: "pricing",
  },
  highlight_price_cents: {
    default: "1900",
    type: "number" as const,
    label: "Highlight price",
    description: "Price for a Highlight submission.",
    group: "pricing",
  },

  // ── Sponsors ─────────────────────────────────────────────────
  sponsor_slot_count: {
    default: "3",
    type: "number" as const,
    label: "Sponsor slots",
    description: "Number of sponsor cards displayed in the sidebar.",
    group: "sponsors",
  },
  sponsor_base_price_cents: {
    default: "300",
    type: "number" as const,
    label: "Daily price",
    description: "Base price per day for a sponsor slot.",
    group: "sponsors",
  },
  sponsor_max_discount: {
    default: "0.3",
    type: "number" as const,
    label: "Max discount",
    description: "Maximum volume discount (0.3 = 30% off for long bookings).",
    group: "sponsors",
  },
  sponsor_discount_full_days: {
    default: "30",
    type: "number" as const,
    label: "Discount full days",
    description: "Number of days to reach the maximum discount.",
    group: "sponsors",
  },
  sponsor_max_days: {
    default: "90",
    type: "number" as const,
    label: "Max booking days",
    description: "Maximum number of days for a single sponsor booking.",
    group: "sponsors",
  },

  // ── Limits ───────────────────────────────────────────────────
  votes_per_window: {
    default: "10",
    type: "number" as const,
    label: "Votes per window",
    description: "Max votes a user can cast within the time window below.",
    group: "limits",
  },
  votes_window_seconds: {
    default: "3600",
    type: "number" as const,
    label: "Vote window",
    description: "Time window for the vote rate limit.",
    group: "limits",
  },
  submissions_per_day: {
    default: "3",
    type: "number" as const,
    label: "Submissions per day",
    description: "Maximum product submissions per user per day.",
    group: "limits",
  },
  max_thumbnail_size_mb: {
    default: "5",
    type: "number" as const,
    label: "Max thumbnail (MB)",
    description: "Maximum file size for uploaded thumbnails.",
    group: "limits",
  },
  related_products_limit: {
    default: "8",
    type: "number" as const,
    label: "Related products",
    description: "Number of 'also launched this week' products shown.",
    group: "limits",
  },
  admin_products_per_page: {
    default: "10",
    type: "number" as const,
    label: "Admin per page",
    description: "Products shown per page in the admin table.",
    group: "limits",
  },
  comments_per_window: {
    default: "5",
    type: "number" as const,
    label: "Comments per window",
    description: "Max comments a user can post within the time window below.",
    group: "limits",
  },
  comments_window_seconds: {
    default: "3600",
    type: "number" as const,
    label: "Comment window (s)",
    description: "Time window in seconds for the comment rate limit.",
    group: "limits",
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
      if (
        key === "launch_hour_utc" &&
        (num < 0 || num > 23 || !Number.isInteger(num))
      ) {
        errors.push("Launch hour must be a whole number between 0 and 23.")
      }
      if (key === "sponsor_max_discount" && (num < 0 || num > 1)) {
        errors.push("Max discount must be between 0 and 1 (e.g. 0.3 = 30%).")
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
    id: "schedule",
    label: "Launch Schedule",
    description: "Configure when and how batches are published.",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Submission tier pricing for Stripe checkout.",
  },
  {
    id: "sponsors",
    label: "Sponsors",
    description: "Sponsor slot configuration and pricing.",
  },
  {
    id: "limits",
    label: "Limits & Rate Limiting",
    description: "Control usage limits and pagination.",
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
