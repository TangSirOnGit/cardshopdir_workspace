"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center bg-white font-sans text-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold">Error</h1>
          <p className="text-[13px] text-neutral-500">
            Something went wrong.
          </p>
          <button
            onClick={reset}
            className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
