"use client"

import { useState } from "react"
import { Zap, Star, Loader2 } from "lucide-react"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

interface Props {
  submissionId: number
  tier: "boost" | "highlight"
  price: string
}

export function UpgradeButton({ submissionId, tier, price }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, targetTier: tier }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        sileo.error({ title: data.error ?? "Couldn't start checkout" })
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      sileo.error({ title: "Network error, please try again" })
      setLoading(false)
    }
  }

  const Icon = tier === "boost" ? Zap : Star

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        "border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
        tier === "boost" && "hover:border-blue-500/40 hover:text-blue-600",
        tier === "highlight" && "hover:border-amber-500/40 hover:text-amber-600",
        loading && "opacity-60",
      )}
    >
      {loading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Icon className="size-3" />
      )}
      {tier === "boost" ? "Skip queue" : "Go live now"} · {price}
    </button>
  )
}
