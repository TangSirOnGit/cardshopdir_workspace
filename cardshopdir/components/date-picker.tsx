"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 text-left text-[14px] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60",
          value ? "text-foreground" : "text-muted-foreground/50",
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        {value ? format(value, "MMM d, yyyy") : placeholder}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-40 mt-1 rounded-xl border border-border bg-background p-2 shadow-lg">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
