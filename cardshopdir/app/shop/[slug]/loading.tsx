import { ShopGridSkeleton } from "@/components/shop-grid-skeleton"

export default function ShopLoading() {
  return (
    <div className="space-y-12 pt-6 sm:pt-10" aria-busy="true">
      <div className="h-3 w-56 animate-pulse bg-muted" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="h-3 w-32 animate-pulse bg-muted" />
          <div className="h-14 w-3/4 animate-pulse bg-muted" />
          <div className="h-4 w-1/2 animate-pulse bg-muted" />
          <div className="h-12 w-64 animate-pulse bg-muted" />
          <div className="flex gap-2">
            <div className="h-11 w-36 animate-pulse border-2 border-ink bg-paper" />
            <div className="h-11 w-36 animate-pulse border-2 border-ink bg-paper" />
          </div>
        </div>
        <div className="aspect-4/3 animate-pulse border-2 border-ink bg-paper-deep" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse border-t-2 border-ink pt-4" />
          <div className="h-36 animate-pulse bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-28 animate-pulse border-t-2 border-ink bg-muted" />
          <div className="h-32 animate-pulse border-t-2 border-ink bg-muted" />
        </div>
      </div>
      <ShopGridSkeleton count={3} />
    </div>
  )
}
