"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Visually collapses long link lists. Children are always rendered into the
 * HTML (SEO-safe); only CSS clipping changes. Focusing inside expands it.
 */
export function Collapsible({
  children,
  collapsedClass = "max-h-44",
  label,
}: {
  children: React.ReactNode
  collapsedClass?: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div onFocusCapture={() => setOpen(true)}>
      <div
        className={`relative overflow-hidden transition-[max-height] duration-500 ease-out ${
          open ? "max-h-[200rem]" : collapsedClass
        }`}
      >
        {children}
        {!open && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent"
          />
        )}
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="label-mono mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3.5 py-2 text-primary transition-all hover:border-primary/60 active:scale-95"
      >
        {open ? "Show less" : label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  )
}
