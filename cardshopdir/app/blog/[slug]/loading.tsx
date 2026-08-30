export default function BlogPostLoading() {
  return (
    <div className="py-6 xl:grid xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-10">
      <article className="mx-auto w-full min-w-0 max-w-184">
        {/* Back link */}
        <div className="mb-6 h-4 w-20 animate-pulse rounded bg-muted" />

        {/* Cover image (top of page) */}
        <div className="mb-8 aspect-video w-full animate-pulse rounded-2xl bg-muted sm:aspect-21/9" />

        {/* Header */}
        <header className="mb-10">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-9 w-full animate-pulse rounded-md bg-muted sm:h-11" />
          <div className="mt-2 h-9 w-4/5 animate-pulse rounded-md bg-muted sm:h-11" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-muted" />

          {/* Meta bar */}
          <div className="mt-7 flex items-center justify-between gap-4 border-t border-border/60 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </header>

        {/* Content paragraphs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-[97%] animate-pulse rounded bg-muted" />
            <div className="h-4 w-[94%] animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>

          {/* H2 */}
          <div className="h-6 w-2/5 animate-pulse rounded bg-muted" />

          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-[96%] animate-pulse rounded bg-muted" />
            <div className="h-4 w-[92%] animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>

          {/* Code block */}
          <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />

          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-[95%] animate-pulse rounded bg-muted" />
            <div className="h-4 w-[88%] animate-pulse rounded bg-muted" />
          </div>
        </div>
      </article>

      {/* TOC sidebar skeleton */}
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-2 border-l border-border/60 pl-3">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </aside>
    </div>
  )
}
