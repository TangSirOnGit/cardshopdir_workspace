export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "admin") {
    redirect("/")
  }

  return (
    <div>
      <div className="border-b border-border bg-muted/20">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 lg:px-12">
          <Link
            href="/admin"
            className="text-[13px] font-semibold transition-colors hover:text-muted-foreground"
          >
            Admin
          </Link>
          <Link
            href="/"
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to site
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}
