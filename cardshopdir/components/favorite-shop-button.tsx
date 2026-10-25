"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import {
  FAVORITES_KEY,
  readBrowserShops,
  SHOP_STORAGE_EVENT,
  toggleFavorite,
  type BrowserShop,
} from "@/lib/shop-browser-storage"

export function FavoriteShopButton({
  shop,
  className = "",
}: {
  shop: BrowserShop
  className?: string
}) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const sync = () =>
      setSaved(
        readBrowserShops(FAVORITES_KEY).some((item) => item.slug === shop.slug)
      )
    sync()
    window.addEventListener(SHOP_STORAGE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(SHOP_STORAGE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [shop.slug])

  function handleClick() {
    setSaved(toggleFavorite(shop))
  }

  return (
    <button
      type="button"
      aria-label={
        saved ? `Remove ${shop.name} from saved shops` : `Save ${shop.name}`
      }
      aria-pressed={saved}
      title={saved ? "Remove from saved shops" : "Save shop"}
      onClick={handleClick}
      className={`flex h-10 w-10 items-center justify-center border-2 border-ink bg-card text-ink transition-transform hover:-translate-y-0.5 active:translate-y-px ${className}`}
    >
      <Heart
        className={`h-5 w-5 transition-transform ${saved ? "scale-110 fill-vermilion text-vermilion" : ""}`}
      />
    </button>
  )
}
