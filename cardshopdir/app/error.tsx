"use client"

import { ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="font-serif text-5xl tracking-tight">Error</h1>
      <p className="text-[14px] text-muted-foreground">
        Something went wrong.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-opacity hover:opacity-60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
