import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SponsorForm } from "../sponsor-form"

export const metadata = { title: "New Sponsor - Admin" }

export default function NewSponsorPage() {
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
        <h1 className="text-lg font-semibold tracking-tight">
          Add sponsor manually
        </h1>
      </div>
      <SponsorForm />
    </div>
  )
}
