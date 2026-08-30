export default function BlogLoading() {
  return (
    <div className="space-y-10 pt-2 sm:pt-4">
      <header className="max-w-2xl">
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted sm:h-9" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
      </header>

      <div className="space-y-12 sm:space-y-14">
        {/* Featured */}
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10">
          <div className="aspect-3/2 animate-pulse rounded-xl bg-muted" />
          <div className="flex flex-col justify-center">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-7 w-11/12 animate-pulse rounded bg-muted sm:h-8" />
            <div className="mt-2 h-7 w-3/4 animate-pulse rounded bg-muted sm:h-8" />
            <div className="mt-4 h-3.5 w-full animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-3.5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="h-px w-full bg-border/60" />

        {/* Rest of posts grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-3/2 animate-pulse rounded-lg bg-muted" />
              <div className="mt-3.5">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-1.5 h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3.5 w-full animate-pulse rounded bg-muted" />
                <div className="mt-1 h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
