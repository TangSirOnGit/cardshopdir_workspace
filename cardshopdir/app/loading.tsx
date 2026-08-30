export default function Loading() {
  return (
    <div className="space-y-8 pt-4 sm:pt-6">
      {/* Hero */}
      <header className="text-center">
        <div className="mx-auto h-9 w-72 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto mt-4 h-5 w-96 animate-pulse rounded bg-muted" />
        <div className="mx-auto mt-6 h-11 w-96 animate-pulse rounded-lg bg-muted" />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/50 bg-muted/30 p-4"
          >
            <div className="mx-auto h-7 w-16 animate-pulse rounded bg-muted" />
            <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* State grid */}
      <section>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-11 w-full animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>

      {/* Game grid */}
      <section>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-11 w-full animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </section>

      {/* Featured shops */}
      <section>
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border/50 p-3"
            >
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
