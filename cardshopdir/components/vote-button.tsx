"use client"

import { useState, useTransition, useOptimistic } from "react"
import { Heart } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { sileo } from "sileo"
import { toggleVote } from "@/lib/actions/vote"

interface VoteButtonProps {
  productId: number
  voted: boolean
  count: number
  size?: "sm" | "md" | "lg"
  onVoteChange?: (productId: number, voted: boolean, count: number) => void
}

export function VoteButton({
  productId,
  voted: initialVoted,
  count: initialCount,
  size = "sm",
  onVoteChange,
}: VoteButtonProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()

  // Confirmed server state — updated after each successful vote
  const [confirmed, setConfirmed] = useState({ voted: initialVoted, count: initialCount })

  const [optimistic, setOptimistic] = useOptimistic(
    confirmed,
    (_state, update: { voted: boolean; count: number }) => update,
  )

  function handleVote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      sileo.info({ title: "Sign in to vote" })
      window.location.href = "/sign-in"
      return
    }

    if (isPending) return

    const nextVoted = !optimistic.voted
    const nextCount = nextVoted
      ? confirmed.count + 1
      : Math.max(0, confirmed.count - 1)

    startTransition(async () => {
      setOptimistic({ voted: nextVoted, count: nextCount })

      try {
        const result = await toggleVote(productId)

        if (result.error) {
          if (result.resetMinutes) {
            sileo.warning({
              title: "Too many votes",
              description: `Try again in ${result.resetMinutes} min`,
            })
          } else {
            sileo.error({ title: result.error })
          }
          return
        }

        // Update confirmed state so useOptimistic converges to real values
        setConfirmed({ voted: result.voted, count: result.voteCount })
        onVoteChange?.(productId, result.voted, result.voteCount)
      } catch {
        sileo.error({ title: "Could not vote" })
      }
    })
  }

  const lg = size === "lg"
  const md = size === "md"

  if (lg) {
    return (
      <button
        type="button"
        onClick={handleVote}
        aria-label={optimistic.voted ? "Remove vote" : "Vote"}
        aria-pressed={optimistic.voted}
        className={cn(
          "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-all",
          optimistic.voted
            ? "border-red-200 bg-red-50 text-red-500 hover:border-red-300 dark:border-red-500/20 dark:bg-red-500/10"
            : "border-border text-foreground hover:bg-muted",
        )}
      >
        <Heart
          className={cn("h-4 w-4", optimistic.voted && "fill-current")}
        />
        <span>{optimistic.voted ? "Voted" : "Upvote"}</span>
        <span className="tabular-nums">{optimistic.count}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleVote}
      aria-label={optimistic.voted ? "Remove vote" : "Vote"}
      aria-pressed={optimistic.voted}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border transition-all",
        md ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1.5 text-[12px]",
        optimistic.voted
          ? "border-red-200 bg-red-50 text-red-500 hover:border-red-300 dark:border-red-500/20 dark:bg-red-500/10"
          : "border-border bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      <Heart
        className={cn(
          md ? "h-3.5 w-3.5" : "h-3 w-3",
          optimistic.voted && "fill-current",
        )}
      />
      <span className="min-w-[1ch] tabular-nums font-medium">
        {optimistic.count}
      </span>
    </button>
  )
}
