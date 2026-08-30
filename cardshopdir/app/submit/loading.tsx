export default function SubmitLoading() {
  return (
    <div className="flex flex-1 flex-col items-center py-8 sm:py-10">
      <div className="w-full max-w-[340px] space-y-5">
        {/* Upload thumbnail (aspect-video rounded-2xl) + caption */}
        <div>
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted/60" />
          <div className="mx-auto mt-1.5 h-2.5 w-64 animate-pulse rounded bg-muted/50" />
        </div>

        {/* Product name */}
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted/50" />

        {/* Tagline */}
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted/50" />

        {/* Description editor (toolbar + min-h-[80px] textarea) */}
        <div className="overflow-hidden rounded-xl bg-muted/50">
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-px bg-border/40" />
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-px bg-border/40" />
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted" />
            <div className="ml-auto h-2.5 w-8 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-2 px-4 py-6">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3/5 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* URL */}
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted/50" />

        {/* Next button (rounded-full py-2.5) */}
        <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}
