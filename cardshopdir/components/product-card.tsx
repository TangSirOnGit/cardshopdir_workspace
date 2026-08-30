"use client"

import { memo } from "react"
import Link from "next/link"
import { VoteButton } from "@/components/vote-button"

interface ProductCardProps {
  id: number
  name: string
  slug: string
  tagline?: string | null
  logoUrl: string | null
  priority?: boolean
  tier?: "free" | "boost" | "highlight"
  voteCount?: number
  voted?: boolean
  onVoteChange?: (productId: number, voted: boolean, count: number) => void
}

export const ProductCard = memo(function ProductCard({
  id,
  name,
  slug,
  tagline,
  logoUrl,
  priority = false,
  tier = "free",
  voteCount = 0,
  voted = false,
  onVoteChange,
}: ProductCardProps) {
  return (
    <div className="group relative -mx-3 flex items-center gap-3.5 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:py-3.5">
      <Link
        href={`/p/${slug}`}
        className="absolute inset-0 z-0"
        aria-label={name}
      >
        <span className="sr-only">{name}</span>
      </Link>

      {logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoUrl}
          alt=""
          width={44}
          height={44}
          className="size-10 shrink-0 rounded-lg bg-muted object-contain sm:size-11"
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground sm:size-11">
          {name.charAt(0).toUpperCase()}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 truncate text-[13px] leading-tight font-semibold">
          {name}
          {tier === "highlight" && (
            <span className="shrink-0 rounded bg-foreground px-1 py-px text-[9px] font-semibold tracking-wider text-background uppercase">
              Featured
            </span>
          )}
          {tier === "boost" && (
            <span className="shrink-0 rounded bg-muted px-1 py-px text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
              Boost
            </span>
          )}
        </span>
        {tagline && (
          <span className="truncate text-[12px] leading-tight text-muted-foreground">
            {tagline}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <VoteButton
          productId={id}
          voted={voted}
          count={voteCount}
          onVoteChange={onVoteChange}
        />
      </div>
    </div>
  )
})
