export default function AdminBlogLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-1.5 h-3.5 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
              <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="hidden h-3 w-20 animate-pulse rounded bg-muted sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
