import type { Metadata } from "next"
import { getSetting } from "@/lib/settings"

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting("site_name")
  return {
    title: `Profile · ${siteName}`,
    robots: { index: false },
  }
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
