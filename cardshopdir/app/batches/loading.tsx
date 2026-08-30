export default function BatchesLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pt-2 sm:pt-4">
      {/* Back + title */}
      <div>
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
      </div>

      {/* Year group */}
      <div>
        <div className="mb-3 h-3 w-10 animate-pulse rounded bg-muted" />
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-3 w-14 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
