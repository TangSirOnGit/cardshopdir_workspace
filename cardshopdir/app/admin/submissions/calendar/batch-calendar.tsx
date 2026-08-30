import { Zap, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekData {
  week: number
  year: number
  monday: string
  free: number
  boost: number
  highlight: number
  freeSlots: number
  isCurrentWeek: boolean
}

export function BatchCalendar({
  weeks,
  freePerBatch,
}: {
  weeks: WeekData[]
  freePerBatch: number
}) {
  if (weeks.length === 0) {
    return (
      <p className="py-20 text-center text-[13px] text-muted-foreground/50">
        No schedule data.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {weeks.map((w) => {
        const pct = Math.min((w.free / freePerBatch) * 100, 100)
        const circumference = 2 * Math.PI * 18
        return (
          <div
            key={`${w.year}-${w.week}`}
            className={cn(
              "relative flex items-center gap-3 rounded-xl p-3",
              w.isCurrentWeek ? "bg-muted/50" : "bg-muted/20"
            )}
          >
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  className={cn(
                    w.freeSlots <= 0
                      ? "stroke-red-500"
                      : w.freeSlots <= 5
                        ? "stroke-amber-500"
                        : "stroke-emerald-500"
                  )}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (pct / 100) * circumference}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums">
                {w.free}/{freePerBatch}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-medium tabular-nums">
                  W{w.week}
                </span>
                <span className="text-[10px] text-muted-foreground/40">
                  {w.monday}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] tabular-nums",
                    w.boost > 0
                      ? "text-blue-500"
                      : "text-muted-foreground/25"
                  )}
                >
                  <Zap className="h-2.5 w-2.5" />
                  {w.boost}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] tabular-nums",
                    w.highlight > 0
                      ? "text-amber-500"
                      : "text-muted-foreground/25"
                  )}
                >
                  <Star className="h-2.5 w-2.5" />
                  {w.highlight}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
