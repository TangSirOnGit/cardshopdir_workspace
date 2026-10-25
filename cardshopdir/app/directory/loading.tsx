import { ShopGridSkeleton } from "@/components/shop-grid-skeleton"

export default function DirectoryLoading() {
  return (
    <div className="space-y-12 pt-6 sm:pt-10" aria-busy="true">
      <div className="bleed band-paper space-y-5 border-y-2 border-ink py-10 sm:py-14">
        <div className="h-3 w-36 animate-pulse bg-paper-deep" />
        <div className="h-12 w-3/4 animate-pulse bg-paper-deep sm:h-16" />
        <div className="h-4 w-2/3 animate-pulse bg-paper-deep" />
      </div>
      <div className="grid grid-cols-2 gap-0.5 border-2 border-ink bg-ink sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 bg-paper p-6 sm:p-8">
            <div className="h-10 w-24 animate-pulse bg-paper-deep" />
            <div className="h-3 w-20 animate-pulse bg-paper-deep" />
          </div>
        ))}
      </div>
      <section className="space-y-6">
        <div className="h-10 w-64 animate-pulse border-t-2 border-ink pt-4" />
        <ShopGridSkeleton count={6} />
      </section>
    </div>
  )
}
