import { getSettingNumber } from "@/lib/settings"

export default async function ProductLoading() {
  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      {/* Back */}
      <div className="h-4 w-14 animate-pulse rounded bg-muted" />

      {/* Two-column layout */}
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        {/* Main */}
        <div className="min-w-0 flex-1 space-y-8">
          {/* Thumbnail */}
          <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />

          {/* Product info */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-5 w-72 animate-pulse rounded bg-muted" />
            </div>
            {/* Description */}
            <div className="max-w-2xl space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>

            {/* Mobile actions */}
            <div className="space-y-2.5 pt-1 lg:hidden">
              <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
            </div>

            {/* Meta inline */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Also launched */}
          <div className="space-y-4 border-t border-border pt-8">
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex shrink-0 flex-col space-y-8 lg:w-64">
          {/* Actions */}
          <div className="hidden space-y-2.5 lg:block">
            <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
          </div>

          {/* Details */}
          <div className="space-y-2.5">
            <div className="h-3 w-14 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="space-y-2.5">
            <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            <div className="flex gap-1.5">
              <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
              <div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
              <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
            </div>
          </div>

          {/* Sponsors */}
          <div className="space-y-2.5">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            {Array.from({ length: await getSettingNumber("sponsor_slot_count") || 3 }).map((_, i) => (
              <div key={i} className="h-[52px] w-full animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
