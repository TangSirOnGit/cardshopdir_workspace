"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { TocItem } from "@/lib/toc"

/** Tracks *all* headings currently inside the viewport window. */
function useActiveAnchors(ids: string[]): string[] {
  const [active, setActive] = useState<string[]>([])

  useEffect(() => {
    if (ids.length === 0) return
    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        setActive(ids.filter((id) => visible.has(id)))
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] },
    )

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [ids])

  return active
}

type Rect = { top: number; height: number }

/**
 * Measures the vertical span (top + height) of the active <a> elements inside
 * the TOC list. Used to position the sliding marker bar.
 */
function useActiveRect(
  listRef: React.RefObject<HTMLUListElement | null>,
  active: string[],
): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    function measure() {
      if (!list || active.length === 0) return
      let upper = Number.MAX_VALUE
      let lower = 0
      for (const id of active) {
        const el = list.querySelector<HTMLElement>(`a[href="#${id}"]`)
        if (!el) continue
        upper = Math.min(upper, el.offsetTop)
        lower = Math.max(lower, el.offsetTop + el.offsetHeight)
      }
      if (upper === Number.MAX_VALUE) return
      setRect({ top: upper, height: lower - upper })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [active, listRef])

  return rect
}

export function TocSidebar({ toc }: { toc: TocItem[] }) {
  const ids = toc.map((t) => t.id)
  const active = useActiveAnchors(ids)
  const listRef = useRef<HTMLUListElement>(null)
  const rect = useActiveRect(listRef, active)

  if (toc.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="text-[12.5px]">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        On this page
      </p>
      <div className="relative">
        {/* Static rail */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-0 w-px bg-border"
        />

        {/* Sliding marker — matches the active heading span */}
        {rect && (
          <div
            aria-hidden
            className="absolute left-0 w-px bg-foreground transition-all duration-300 ease-out"
            style={{
              transform: `translateY(${rect.top}px)`,
              height: rect.height,
            }}
          />
        )}

        <ul ref={listRef} className="flex flex-col">
          {toc.map((item) => {
            const isActive = active.includes(item.id)
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={cn(
                    "block py-1.5 leading-snug text-muted-foreground transition-colors wrap-anywhere hover:text-foreground",
                    item.level === 2 ? "pl-4" : "pl-7",
                    isActive && "font-medium text-foreground",
                  )}
                >
                  {item.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
