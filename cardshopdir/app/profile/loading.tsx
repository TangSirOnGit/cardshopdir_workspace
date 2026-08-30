export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pt-2 sm:pt-4">
      {/* Back */}
      <div className="mb-6 h-4 w-14 animate-pulse rounded bg-muted" />

      {/* Header */}
      <div className="mb-8 flex items-center gap-4 px-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-44 animate-pulse rounded bg-muted" />
        </div>
        <div className="ml-auto h-8 w-20 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Submissions list */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl bg-muted/30 p-3"
          >
            <div className="aspect-video w-32 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
