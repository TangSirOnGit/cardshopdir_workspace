import { env } from "@/lib/env"

const WEBHOOK_URL = env.DISCORD_WEBHOOK_URL
const TIMEOUT_MS = 10_000

export async function notifyDiscord(content: string): Promise<void> {
  if (!WEBHOOK_URL) return

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `Discord webhook failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`,
    )
  }
}

export function notifyNewUser(name: string, email: string) {
  return notifyDiscord(`👤 New user — ${name} (${email})`)
}

export function notifyNewSubmission(
  name: string,
  tier: string,
  websiteUrl: string
) {
  const tierLabel =
    tier === "free" ? "Free" : tier === "boost" ? "💵 Boost" : "💰 Highlight"
  return notifyDiscord(
    `📦 New submission — ${name} [${tierLabel}]\n${websiteUrl}`
  )
}
