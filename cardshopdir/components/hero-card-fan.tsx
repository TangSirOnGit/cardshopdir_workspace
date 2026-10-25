import { Star } from "lucide-react"

interface Props {
  totalShops: number
  totalStates: number
  avgRating: number | null
}

const BACK = [
  { hue: 85, rot: -9, x: "-4.5rem", y: "2rem", label: "Pokémon" },
  { hue: 25, rot: 8, x: "4.5rem", y: "3rem", label: "Flesh & Blood" },
]

/** Decorative stack of flat trading cards for the hero. Purely presentational. */
export function HeroCardFan({ totalShops, totalStates, avgRating }: Props) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto hidden h-[27rem] w-full max-w-sm lg:block"
    >
      {BACK.map((c, i) => (
        <div
          key={c.label}
          className="absolute top-8 left-1/2 w-56 border-2 border-ink bg-card shadow-[6px_6px_0_0_#04150f]"
          style={{
            transform: `translateX(calc(-50% + ${c.x})) translateY(${c.y}) rotate(${c.rot}deg)`,
            animation: `deal 0.8s cubic-bezier(0.2,0.8,0.2,1) ${0.2 + i * 0.12}s both`,
          }}
        >
          <div className="aspect-5/7 p-3">
            <div
              className="h-3/5 border-2 border-ink"
              style={{ backgroundColor: `oklch(0.8 0.13 ${c.hue})` }}
            />
            <p className="label-mono mt-3 text-ink">{c.label}</p>
          </div>
        </div>
      ))}

      <div
        className="absolute top-0 left-1/2 w-64 -translate-x-1/2 -rotate-2"
        style={{
          animation: "deal 0.9s cubic-bezier(0.2,0.8,0.2,1) 0.05s both",
        }}
      >
        <div className="border-2 border-ink bg-card shadow-[8px_8px_0_0_#04150f]">
          <div className="flex aspect-5/7 flex-col p-4">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <span className="label-mono text-ink">Local Shop</span>
              <span className="label-mono text-vermilion">No. 001</span>
            </div>
            <div className="mt-3 flex flex-1 flex-col items-center justify-center border-2 border-ink bg-marigold">
              <span className="font-serif text-6xl leading-none font-bold tracking-tighter text-ink tabular-nums">
                {totalShops.toLocaleString()}
              </span>
              <span className="label-mono mt-2 text-ink">Card Shops</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] font-semibold text-ink">
              <span>{totalStates} states</span>
              {avgRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-vermilion text-vermilion" />
                  {avgRating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
