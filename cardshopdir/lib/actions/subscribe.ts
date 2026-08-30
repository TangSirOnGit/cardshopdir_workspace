"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { plunk } from "@/lib/plunk"
import { sendWelcomeEmail } from "@/lib/emails"
import { rateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"

const emailSchema = z.email("Invalid email")

export async function subscribe(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const raw = formData.get("email") as string | null
  const result = emailSchema.safeParse(raw)

  if (!result.success) {
    return { ok: false, error: "Invalid email" }
  }

  const email = result.data

  // Unauthenticated, and it sends mail to whatever address is supplied — so it
  // is a mail relay unless it is rate limited like every other public action.
  const ip = getClientIp(await headers())
  const { allowed } = await rateLimit({
    key: `subscribe:${ip}`,
    limit: 5,
    windowSeconds: 3600,
  })

  if (!allowed) {
    return { ok: false, error: "Too many requests. Please try again later." }
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    await plunk.track({
      email: normalizedEmail,
      event: "newsletter_subscribed",
      subscribed: true,
    })

    sendWelcomeEmail(normalizedEmail).catch(console.error)

    return { ok: true }
  } catch (err) {
    console.error("[subscribe]", err)
    return { ok: false, error: "Something went wrong" }
  }
}
