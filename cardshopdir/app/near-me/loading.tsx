import { ShopGridSkeleton } from "@/components/shop-grid-skeleton"

export default function NearMeLoading() {
  return (
    <div className="space-y-12 pt-6 sm:pt-10" aria-busy="true">
      <header className="space-y-5 py-10 text-center sm:py-14">
        <div className="mx-auto h-3 w-48 animate-pulse bg-muted" />
        <div className="mx-auto h-12 w-3/4 animate-pulse bg-muted sm:h-16" />
        <div className="mx-auto h-4 w-2/3 animate-pulse bg-muted" />
        <div className="mx-auto h-14 max-w-2xl animate-pulse border-2 border-ink bg-card" />
      </header>
      <div className="grid grid-cols-2 gap-0.5 border-2 border-ink bg-ink sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 bg-paper p-6">
            <div className="h-10 w-24 animate-pulse bg-paper-deep" />
            <div className="h-3 w-20 animate-pulse bg-paper-deep" />
          </div>
        ))}
      </div>
      <ShopGridSkeleton count={6} />
    </div>
  )
}
