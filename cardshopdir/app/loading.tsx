import { getSettingNumber } from "@/lib/settings"

export default async function Loading() {
  return (
    <div className="space-y-8 pt-2 sm:pt-4">
      {/* Hero */}
      <header>
        <div className="h-8 w-80 animate-pulse rounded-md bg-muted" />
      </header>

      {/* Two-column layout */}
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Meta bar */}
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </div>

          {/* Product list */}
          <div className="space-y-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
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

        {/* Sidebar */}
        <aside className="flex shrink-0 flex-col space-y-8 lg:w-64">
          {/* Submit CTA */}
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3.5 w-52 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-9 w-36 animate-pulse rounded-lg bg-muted" />
          </div>

          {/* Sponsors */}
          <div className="space-y-2.5">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            {Array.from({ length: await getSettingNumber("sponsor_slot_count") || 3 }).map((_, i) => (
              <div key={i} className="h-[52px] w-full animate-pulse rounded-lg bg-muted" />
            ))}
          </div>

          {/* Resources */}
          <div className="space-y-2.5">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="space-y-1">
              <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
