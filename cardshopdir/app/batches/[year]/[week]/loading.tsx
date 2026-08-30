export default function BatchWeekLoading() {
  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      {/* Back + title row */}
      <div>
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="mt-3 flex items-baseline gap-3">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-lg px-3 py-3 sm:gap-4 sm:py-3.5">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted sm:h-11 sm:w-11" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted sm:w-28" />
              <div className="hidden h-3.5 w-40 animate-pulse rounded bg-muted sm:block" />
            </div>
            <div className="h-7 w-14 shrink-0 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
