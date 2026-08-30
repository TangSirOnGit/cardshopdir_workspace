"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useSyncExternalStore } from "react"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

interface Props {
  variant?: "icon" | "button"
}

export function ThemeToggle({ variant = "icon" }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  if (!mounted) {
    return variant === "button" ? (
      <div className="h-4 w-10" />
    ) : (
      <div className="h-6 w-6" />
    )
  }

  const isDark = resolvedTheme === "dark"
  const toggle = () => setTheme(isDark ? "light" : "dark")

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "Light" : "Dark"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-[15px] w-[15px]" />
      ) : (
        <Moon className="h-[15px] w-[15px]" />
      )}
    </button>
  )
}
