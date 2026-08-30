import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { submissions } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { RevisionForm } from "./revision-form"

export default async function RevisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/")

  const { id } = await params
  const submissionId = parseInt(id, 10)
  if (isNaN(submissionId)) notFound()

  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.id, submissionId),
      eq(submissions.userId, session.user.id),
      eq(submissions.status, "revision"),
    ),
    columns: {
      id: true,
      name: true,
      tagline: true,
      websiteUrl: true,
      description: true,
      thumbnailUrl: true,
      revisionReasons: true,
    },
  })

  if (!submission) notFound()

  let reasons: string[] = []
  if (submission.revisionReasons) {
    try {
      reasons = JSON.parse(submission.revisionReasons)
    } catch {
      reasons = []
    }
  }

  return (
    <RevisionForm
      submissionId={submission.id}
      name={submission.name}
      tagline={submission.tagline}
      websiteUrl={submission.websiteUrl}
      description={submission.description}
      thumbnailUrl={submission.thumbnailUrl}
      reasons={reasons}
    />
  )
}
