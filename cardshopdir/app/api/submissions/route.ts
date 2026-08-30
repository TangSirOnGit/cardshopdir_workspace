import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, and, ne, or, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { sendSubmissionReceivedEmail } from "@/lib/emails"
import { notifyNewSubmission } from "@/lib/discord"
import { rateLimit } from "@/lib/rate-limit"
import { cacheFavicon } from "@/lib/images"
import sanitizeHtml from "sanitize-html"
import { normalizeUrl } from "@/lib/normalize-url"
import { createSubmissionSchema } from "@/lib/submission-schema"

const DESCRIPTION_ALLOWED_TAGS = ["p", "strong", "em", "ul", "ol", "li", "a", "br"]
const DESCRIPTION_ALLOWED_ATTRS = { a: ["href", "target", "rel"] }
const DESCRIPTION_CHAR_LIMIT = 1000

function sanitizeDescription(raw: string | undefined | null): string | null {
  if (!raw || raw === "<p></p>") return null

  const clean = sanitizeHtml(raw, {
    allowedTags: DESCRIPTION_ALLOWED_TAGS,
    allowedAttributes: DESCRIPTION_ALLOWED_ATTRS,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
      }),
    },
  })

  const textOnly = clean.replace(/<[^>]*>/g, "").trim()
  if (!textOnly) return null
  if (textOnly.length > DESCRIPTION_CHAR_LIMIT) return null

  return clean
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = await rateLimit({
    key: `submissions:${session.user.id}`,
    limit: 5,
    windowSeconds: 3600,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createSubmissionSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    )
  }

  const { websiteUrl, thumbnailUrl, name, tagline, description, tier } =
    parsed.data

  const normalizedUrl = normalizeUrl(websiteUrl)
  const normalizedName = name.toLowerCase()

  // Block duplicate: same user + (same normalized URL or same name) + not rejected
  const duplicate = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.userId, session.user.id),
      ne(submissions.status, "rejected"),
      or(
        sql`lower(trim(${submissions.websiteUrl})) = ${normalizedUrl}
          OR lower(replace(replace(${submissions.websiteUrl}, 'https://www.', 'https://'), 'http://www.', 'http://')) = ${normalizedUrl}`,
        sql`lower(trim(${submissions.name})) = ${normalizedName}`,
      ),
    ),
  })

  if (duplicate) {
    return NextResponse.json(
      { error: "You already have an active submission for this product" },
      { status: 409 },
    )
  }

  const validTier = tier === "boost" || tier === "highlight" ? tier : "free"
  const status = validTier === "free" ? "pending" : "draft"

  const [submission] = await db
    .insert(submissions)
    .values({
      userId: session.user.id,
      name,
      tagline,
      description: sanitizeDescription(description),
      websiteUrl: normalizedUrl,
      thumbnailUrl,
      tier: validTier,
      status,
    })
    .returning()

  // Cache favicon to R2 in background (don't block the response)
  cacheFavicon(normalizedUrl)
    .then((logoUrl) => {
      if (logoUrl) {
        db.update(submissions)
          .set({ logoUrl })
          .where(eq(submissions.id, submission.id))
          .catch(console.error)
      }
    })
    .catch(console.error)

  if (validTier === "free") {
    sendSubmissionReceivedEmail(session.user.email, name, validTier).catch(console.error)
  }

  notifyNewSubmission(name, validTier, normalizedUrl).catch(console.error)

  return NextResponse.json(submission)
}
