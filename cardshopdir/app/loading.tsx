import { ShopGridSkeleton } from "@/components/shop-grid-skeleton"

export default function Loading() {
  return (
    <div className="space-y-14 pt-6 sm:pt-10" aria-busy="true">
      <header className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="h-3 w-40 animate-pulse bg-muted" />
          <div className="h-16 w-5/6 animate-pulse bg-muted sm:h-24" />
          <div className="h-4 w-2/3 animate-pulse bg-muted" />
          <div className="h-14 max-w-2xl animate-pulse border-2 border-ink bg-card" />
        </div>
        <div className="hidden aspect-5/7 w-64 animate-pulse justify-self-center border-2 border-ink bg-marigold lg:block" />
      </header>
      <div className="bleed band-paper grid grid-cols-2 gap-0.5 border-y-2 border-ink bg-ink sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 bg-paper p-6 sm:p-8">
            <div className="h-10 w-24 animate-pulse bg-paper-deep" />
            <div className="h-3 w-20 animate-pulse bg-paper-deep" />
          </div>
        ))}
      </div>
      <section className="space-y-6">
        <div className="h-10 w-64 animate-pulse border-t-2 border-ink pt-4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-4/3 animate-pulse border-2 border-ink bg-paper-deep"
            />
          ))}
        </div>
      </section>
      <ShopGridSkeleton count={3} />
    </div>
  )
}
