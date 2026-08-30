"use client"

import { useEffect, useRef } from "react"

export function CodeBlockHydrator({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const buttons = container.querySelectorAll<HTMLButtonElement>(".code-block-copy")

    const handlers = new Map<HTMLButtonElement, () => void>()

    buttons.forEach((btn) => {
      const handler = () => {
        const code = decodeURIComponent(btn.dataset.code ?? "")
        navigator.clipboard.writeText(code)
        btn.classList.add("copied")
        setTimeout(() => btn.classList.remove("copied"), 2000)
      }
      handlers.set(btn, handler)
      btn.addEventListener("click", handler)
    })

    return () => {
      handlers.forEach((handler, btn) => btn.removeEventListener("click", handler))
    }
  }, [])

  return <div ref={ref}>{children}</div>
}
