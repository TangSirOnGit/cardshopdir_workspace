import { db } from "@/lib/db"
import { sponsors } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SponsorForm } from "../sponsor-form"

export const metadata = { title: "Edit Sponsor - Admin" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSponsorPage({ params }: Props) {
  const { id } = await params
  const sponsorId = parseInt(id, 10)
  if (isNaN(sponsorId)) notFound()

  const sponsor = await db.query.sponsors.findFirst({
    where: eq(sponsors.id, sponsorId),
  })

  if (!sponsor) notFound()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/sponsors"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Edit sponsor</h1>
      </div>
      <SponsorForm
        sponsor={{
          id: sponsor.id,
          name: sponsor.name,
          tagline: sponsor.tagline,
          websiteUrl: sponsor.websiteUrl,
          email: sponsor.email,
          imageUrl: sponsor.imageUrl,
          startsAt: sponsor.startsAt,
          endsAt: sponsor.endsAt,
        }}
      />
    </div>
  )
}
