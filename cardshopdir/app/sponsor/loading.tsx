export default function SponsorLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 pt-2 sm:pt-4">
      {/* Back link */}
      <div className="h-4 w-14 animate-pulse rounded bg-muted" />

      {/* Hero — header > h1 */}
      <header className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </header>

      {/* How it works — section > label + 3 steps */}
      <section className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-4 w-3 shrink-0 animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-3 shrink-0 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-3 shrink-0 animate-pulse rounded bg-muted" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </section>

      {/* Booking — section > label + SponsorBooking (space-y-6) */}
      <section className="space-y-4">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />

        <div className="space-y-6">
          {/* Calendar */}
          <div className="h-[280px] w-full animate-pulse rounded-lg border border-border bg-muted/40" />

          {/* Pricing summary bar */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="flex items-baseline gap-3">
              <div className="h-4 w-14 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          </div>

          {/* Sponsor details form */}
          <div className="space-y-4">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-12 animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted/40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted/40" />
            </div>

            <div className="space-y-1.5">
              <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted/40" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-8 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-10 w-full animate-pulse rounded-lg border border-dashed border-border bg-muted/20" />
            </div>

            <div className="mt-2 h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </section>

      {/* Why sponsor — section > label + 2 benefits */}
      <section className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-44 animate-pulse rounded bg-muted" />
                <div className="mt-1.5 h-3.5 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
