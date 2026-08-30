"use client"

import { useQueryState, parseAsInteger } from "nuqs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("…")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push("…")
  pages.push(total)
  return pages
}

export function BlogPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  )

  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-20"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex size-9 items-center justify-center text-[13px] text-muted-foreground/40"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-[13px] tabular-nums transition-colors",
              p === page
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-20"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
