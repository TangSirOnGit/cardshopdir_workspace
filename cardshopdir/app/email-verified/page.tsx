import type { Metadata } from "next"
import Link from "next/link"
import { getSetting } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting("site_name")
  return {
    title: `Email verified · ${siteName}`,
  }
}

export default function EmailVerifiedPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="max-w-[320px] space-y-4 text-center">
        <h1 className="font-serif text-2xl tracking-tight">Email verified</h1>
        <p className="text-[13px] text-muted-foreground">
          Your account is now active. You can start discovering shops.
        </p>
        <Link
          href="/submit"
          className="inline-block rounded-full bg-foreground px-5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
        >
          Submit a product
        </Link>
      </div>
    </div>
  )
}
