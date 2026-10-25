export function ShopGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-label="Loading shops"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="overflow-hidden border-2 border-ink bg-card"
        >
          <div className="aspect-16/10 animate-pulse border-b-2 border-ink bg-paper-deep" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse bg-paper-deep" />
            <div className="h-3 w-1/2 animate-pulse bg-paper-deep" />
            <div className="h-3 w-2/3 animate-pulse bg-paper-deep" />
            <div className="mt-5 h-8 border-t border-ink/20 pt-3">
              <div className="h-3 w-1/3 animate-pulse bg-paper-deep" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
