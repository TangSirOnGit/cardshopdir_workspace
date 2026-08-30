import { env } from "@/lib/env"
import { SITE_DOMAIN } from "@/config"
import { getSetting } from "@/lib/settings"

const API_URL = "https://next-api.useplunk.com/v1"
const SECRET_KEY = env.PLUNK_SECRET_KEY
const PUBLIC_KEY = env.PLUNK_PUBLIC_KEY

async function getFromEmail() {
  const contactEmail = await getSetting("contact_email")
  return contactEmail || env.PLUNK_FROM_EMAIL || `contact@${SITE_DOMAIN}`
}

if (!SECRET_KEY) {
  console.warn("[Plunk] PLUNK_SECRET_KEY is not set — emails will not be sent")
}
if (!PUBLIC_KEY) {
  console.warn("[Plunk] PLUNK_PUBLIC_KEY is not set — event tracking will not work")
}

async function plunkFetch(
  path: string,
  body: Record<string, unknown>,
  key: string | undefined = SECRET_KEY,
) {
  if (!key) return null

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!data.success && data.success !== undefined) {
    const msg = data.error?.message ?? data.message ?? JSON.stringify(data)
    throw new Error(`[Plunk] ${msg}`)
  }

  return data.data ?? data
}

// ── Transactional emails ──────────────────────────────────────────────────

interface SendEmailOptions {
  to: string | string[]
  subject: string
  body: string
  subscribed?: boolean
}

async function send({ to, subject, body, subscribed }: SendEmailOptions) {
  const [fromName, fromEmail] = await Promise.all([
    getSetting("site_name"),
    getFromEmail(),
  ])
  return plunkFetch("/send", {
    to,
    subject,
    body,
    from: { name: fromName, email: fromEmail },
    ...(subscribed !== undefined && { subscribed }),
  })
}

// ── Event tracking (creates/updates contacts in Plunk) ────────────────────

interface TrackOptions {
  email: string
  event: string
  subscribed?: boolean
  data?: Record<string, unknown>
}

async function track({ email, event, subscribed, data }: TrackOptions) {
  return plunkFetch(
    "/track",
    {
      email,
      event,
      ...(subscribed !== undefined && { subscribed }),
      ...(data && { data }),
    },
    PUBLIC_KEY,
  )
}

// ── Campaigns (broadcasts) ────────────────────────────────────────────────

interface CreateCampaignOptions {
  name: string
  subject: string
  body: string
}

async function createCampaign({ name, subject, body }: CreateCampaignOptions) {
  if (!SECRET_KEY) return null

  const [fromName, fromEmail] = await Promise.all([
    getSetting("site_name"),
    getFromEmail(),
  ])
  const res = await fetch(`${API_URL.replace("/v1", "")}/campaigns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      subject,
      body,
      from: fromEmail,
      fromName,
      audienceType: "ALL",
    }),
  })

  const data = await res.json()
  if (!data.success) {
    throw new Error(`[Plunk] Campaign create failed: ${data.message ?? JSON.stringify(data)}`)
  }
  return data.data as { id: string }
}

async function sendCampaign(campaignId: string) {
  if (!SECRET_KEY) return null

  const res = await fetch(`${API_URL.replace("/v1", "")}/campaigns/${campaignId}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })

  const data = await res.json()
  return data
}

export const plunk = {
  emails: { send },
  track,
  campaigns: { create: createCampaign, send: sendCampaign },
}
