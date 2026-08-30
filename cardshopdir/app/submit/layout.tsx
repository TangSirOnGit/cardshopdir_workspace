import type { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getSetting } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting("site_name")
  return {
    title: `Submit your product · Get featured on ${siteName}`,
    description: `Submit your product to be featured on ${siteName}'s next weekly batch. A curated directory, published every Monday.`,
    alternates: { canonical: "/submit" },
  }
}

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <h1 className="sr-only">Submit your product</h1>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        }
      >
        {children}
      </Suspense>
    </>
  )
}
