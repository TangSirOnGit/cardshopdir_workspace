"use client"

import { useEffect, useState } from "react"
import { Heart, History } from "lucide-react"
import { ShopGrid } from "@/components/shop-card"
import {
  FAVORITES_KEY,
  RECENT_SHOPS_KEY,
  readBrowserShops,
  SHOP_STORAGE_EVENT,
  type BrowserShop,
} from "@/lib/shop-browser-storage"

type ShelfTab = "recent" | "saved"

export function PersonalShopShelf() {
  const [tab, setTab] = useState<ShelfTab>("recent")
  const [recent, setRecent] = useState<BrowserShop[]>([])
  const [saved, setSaved] = useState<BrowserShop[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => {
      setRecent(readBrowserShops(RECENT_SHOPS_KEY))
      setSaved(readBrowserShops(FAVORITES_KEY))
      setReady(true)
    }
    sync()
    window.addEventListener(SHOP_STORAGE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(SHOP_STORAGE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  if (!ready || (recent.length === 0 && saved.length === 0)) return null

  const activeShops = tab === "recent" ? recent : saved

  return (
    <section className="bleed band-paper border-y-2 border-ink py-12 sm:py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-4">
        <div>
          <p className="label-mono text-primary">Your collection</p>
          <h2 className="mt-2 font-serif text-3xl leading-none font-bold tracking-tight sm:text-4xl">
            Pick up where you left off
          </h2>
        </div>
        <div className="flex border-2 border-ink">
          <button
            type="button"
            aria-pressed={tab === "recent"}
            onClick={() => setTab("recent")}
            className={`flex items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase transition-colors ${
              tab === "recent"
                ? "bg-ink text-paper"
                : "text-ink hover:bg-paper-deep"
            }`}
          >
            <History className="h-4 w-4" />
            Recent
          </button>
          <button
            type="button"
            aria-pressed={tab === "saved"}
            onClick={() => setTab("saved")}
            className={`flex items-center gap-2 border-l-2 border-ink px-3 py-2 text-[12px] font-bold uppercase transition-colors ${
              tab === "saved"
                ? "bg-ink text-paper"
                : "text-ink hover:bg-paper-deep"
            }`}
          >
            <Heart className="h-4 w-4" />
            Saved ({saved.length})
          </button>
        </div>
      </div>

      {activeShops.length > 0 ? (
        <ShopGrid shops={activeShops.slice(0, 3)} />
      ) : (
        <p className="border-t border-ink/30 py-6 text-sm text-ink-muted">
          {tab === "recent"
            ? "Shops you visit will show up here."
            : "Save a shop with the heart button to find it here."}
        </p>
      )}
    </section>
  )
}
