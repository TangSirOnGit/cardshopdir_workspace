"use client"

import { useEffect } from "react"
import { addRecentShop, type BrowserShop } from "@/lib/shop-browser-storage"

export function ShopViewTracker({ shop }: { shop: BrowserShop }) {
  useEffect(() => {
    addRecentShop(shop)
  }, [shop])

  return null
}
