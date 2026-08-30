export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* KPIs — 2 cols mobile, 4 cols desktop, 8 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/30" />
        ))}
      </div>

      {/* Charts — 3 cols */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Calendar card */}
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
