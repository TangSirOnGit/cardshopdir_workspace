import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import sanitizeHtml from "sanitize-html"
import { rateLimit } from "@/lib/rate-limit"
import { resubmitSchema } from "@/lib/submission-schema"

const DESCRIPTION_ALLOWED_TAGS = [
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "br",
]
const DESCRIPTION_ALLOWED_ATTRS = { a: ["href", "target", "rel"] }
const DESCRIPTION_CHAR_LIMIT = 1000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { allowed } = await rateLimit({
    key: `resubmit:${session.user.id}`,
    limit: 10,
    windowSeconds: 3600,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many revisions. Please try again later." },
      { status: 429 },
    )
  }

  const { id } = await params
  const submissionId = parseInt(id, 10)
  if (isNaN(submissionId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.id, submissionId),
      eq(submissions.userId, session.user.id),
      eq(submissions.status, "revision"),
    ),
    columns: { id: true },
  })

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found or not in revision" },
      { status: 404 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = resubmitSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    )
  }
  const body = parsed.data

  const updates: Record<string, string | null> = {}

  if (body.name) updates.name = body.name
  if (body.tagline !== undefined) updates.tagline = body.tagline
  if (body.websiteUrl) updates.websiteUrl = body.websiteUrl
  if (body.thumbnailUrl) updates.thumbnailUrl = body.thumbnailUrl

  if (body.description !== undefined && body.description !== null) {
    const sanitized = sanitizeHtml(body.description, {
      allowedTags: DESCRIPTION_ALLOWED_TAGS,
      allowedAttributes: DESCRIPTION_ALLOWED_ATTRS,
    }).trim()
    if (sanitized.length > DESCRIPTION_CHAR_LIMIT * 3) {
      return NextResponse.json(
        { error: "Description is too long" },
        { status: 400 },
      )
    }
    updates.description = sanitized.length ? sanitized : null
  }

  await db
    .update(submissions)
    .set({ ...updates, status: "pending" })
    .where(eq(submissions.id, submissionId))

  revalidatePath("/profile")
  revalidatePath("/admin/submissions")

  return NextResponse.json({ ok: true })
}
