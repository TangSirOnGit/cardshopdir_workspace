"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface Props {
  children: React.ReactNode
  siteName: string
}

// Routes that should render without the site's header, main wrapper, or footer.
// These are typically standalone marketing/sales pages for the template itself.
const STANDALONE_ROUTES: string[] = []

function isStandalone(pathname: string) {
  return STANDALONE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  )
}

export function SiteChrome({ children, siteName }: Props) {
  const pathname = usePathname()

  if (isStandalone(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <div className="sticky top-0 z-50 bg-background">
        <Header siteName={siteName} />
      </div>
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-x-clip px-6 pt-1 pb-6 lg:px-12"
      >
        {children}
      </main>
      <Footer siteName={siteName} />
    </>
  )
}
