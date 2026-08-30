"use client"

import { useCallback, useState } from "react"
import { LayoutGroup, motion } from "motion/react"
import { ProductCard } from "@/components/product-card"

export interface ProductItem {
  id: number
  name: string
  slug: string
  tagline?: string | null
  thumbnailUrl: string
  logoUrl: string | null
  tier: "free" | "boost" | "highlight"
  voteCount: number
  voted: boolean
}

interface ProductGridProps {
  items: ProductItem[]
}

function sortProducts(items: ProductItem[]): ProductItem[] {
  const highlights = items.filter((p) => p.tier === "highlight")
  const others = [...items.filter((p) => p.tier !== "highlight")].sort(
    (a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount
      return a.id - b.id
    }
  )

  if (highlights.length === 0) return others

  const merged: ProductItem[] = []
  let hi = 0
  let oi = 0
  for (let i = 0; i < items.length; i++) {
    if (i % 2 === 0 && hi < highlights.length) {
      merged.push(highlights[hi++])
    } else if (oi < others.length) {
      merged.push(others[oi++])
    } else if (hi < highlights.length) {
      merged.push(highlights[hi++])
    }
  }

  return merged
}

export function ProductGrid({ items: initialItems }: ProductGridProps) {
  const [items, setItems] = useState(() => sortProducts(initialItems))

  const handleVoteChange = useCallback(
    (productId: number, voted: boolean, count: number) => {
      setItems((prev) =>
        sortProducts(
          prev.map((p) =>
            p.id === productId ? { ...p, voteCount: count, voted } : p
          )
        )
      )
    },
    []
  )

  return (
    <LayoutGroup>
      <div className="space-y-0.5">
        {items.map((product, i) => (
          <motion.div
            key={product.id}
            layout="position"
            transition={{
              layout: { type: "spring", stiffness: 300, damping: 30 },
            }}
          >
            <ProductCard
              id={product.id}
              name={product.name}
              slug={product.slug}
              tagline={product.tagline}
              logoUrl={product.logoUrl}
              priority={i < 3}
              tier={product.tier}
              voteCount={product.voteCount}
              voted={product.voted}
              onVoteChange={handleVoteChange}
            />
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  )
}
