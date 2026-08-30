"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Reply, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { postComment, deleteOwnComment } from "@/lib/actions/comment"
import { sileo } from "sileo"

// ── Types ─────────────────────────────────────────────────────────

export interface CommentData {
  id: number
  body: string
  parentId: number | null
  createdAt: string
  userId: string
  userName: string
  userImage: string | null
}

interface Props {
  comments: CommentData[]
  productId: number
  slug: string
  sessionUserId: string | null
  totalCount: number
  currentPage: number
  totalPages: number
}

// ── Main ──────────────────────────────────────────────────────────

export function CommentList({
  comments,
  productId,
  slug,
  sessionUserId,
  totalCount,
  currentPage,
  totalPages,
}: Props) {
  const [pageLoadedAt] = useState(() => Date.now())
  const router = useRouter()

  const roots: CommentData[] = []
  const repliesMap = new Map<number, CommentData[]>()
  for (const c of comments) {
    if (c.parentId == null) {
      roots.push(c)
    } else {
      const pid = c.parentId
      const arr = repliesMap.get(pid) ?? []
      arr.push(c)
      repliesMap.set(pid, arr)
    }
  }

  roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  for (const [, replies] of repliesMap) {
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(window.location.search)
    if (page <= 1) {
      params.delete("cp")
    } else {
      params.set("cp", String(page))
    }
    const qs = params.toString()
    router.push(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  return (
    <div>
      {/* Header + form */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
          {totalCount > 0 ? `${totalCount} comment${totalCount !== 1 ? "s" : ""}` : "Comments"}
        </p>

        {sessionUserId ? (
          <CommentForm
            productId={productId}
            slug={slug}
            parentId={null}
            pageLoadedAt={pageLoadedAt}
            placeholder="Leave a comment..."
          />
        ) : (
          <p className="text-[13px] text-muted-foreground">
            <Link href="/sign-in" className="underline transition-colors hover:text-foreground">
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        )}
      </div>

      {/* Thread */}
      {roots.length > 0 && (
        <div className="mt-5 space-y-0 divide-y divide-border/40">
          {roots.map((comment) => {
            const replies = repliesMap.get(comment.id)
            return (
              <div key={comment.id} className="py-3 first:pt-0">
                <CommentBubble
                  comment={comment}
                  slug={slug}
                  productId={productId}
                  sessionUserId={sessionUserId}
                  pageLoadedAt={pageLoadedAt}
                />
                {replies && replies.length > 0 && (
                  <div className="ml-7 mt-1 space-y-0 border-l border-border/30 pl-4">
                    {replies.map((reply) => (
                      <CommentBubble
                        key={reply.id}
                        comment={reply}
                        slug={slug}
                        productId={productId}
                        sessionUserId={sessionUserId}
                        pageLoadedAt={pageLoadedAt}
                        isReply
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-3 w-3" />
            Newer
          </button>
          <span className="text-[11px] text-muted-foreground/50 tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            Older
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Comment bubble ────────────────────────────────────────────────

function CommentBubble({
  comment,
  slug,
  productId,
  sessionUserId,
  pageLoadedAt,
  isReply = false,
}: {
  comment: CommentData
  slug: string
  productId: number
  sessionUserId: string | null
  pageLoadedAt: number
  isReply?: boolean
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const isOwn = sessionUserId === comment.userId

  function executeDelete() {
    setConfirmDelete(false)
    startDelete(async () => {
      try {
        const result = await deleteOwnComment(comment.id, slug)
        if (result.error) sileo.error({ title: result.error })
      } catch {
        sileo.error({ title: "Something went wrong" })
      }
    })
  }

  return (
    <div className={`py-2 ${isDeleting ? "opacity-40" : ""}`}>
      <div className="flex items-start gap-2.5">
        {comment.userImage ? (
          <Image
            src={comment.userImage}
            alt={comment.userName}
            width={20}
            height={20}
            className="mt-0.5 shrink-0 rounded-full"
          />
        ) : (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
            {comment.userName.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium leading-none">
              {comment.userName}
            </span>
            <span className="text-[11px] leading-none text-muted-foreground/40">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {comment.body}
          </p>

          <div className="mt-1.5 flex items-center gap-3">
            {!isReply && sessionUserId && (
              <button
                type="button"
                onClick={() => setShowReplyForm((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/40 transition-colors hover:text-red-500"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && sessionUserId && (
        <div className="ml-7 mt-2">
          <CommentForm
            productId={productId}
            slug={slug}
            parentId={comment.id}
            pageLoadedAt={pageLoadedAt}
            onDone={() => setShowReplyForm(false)}
            placeholder={`Reply to ${comment.userName}...`}
            compact
          />
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your comment{!isReply ? " and all its replies" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Comment form ──────────────────────────────────────────────────

function CommentForm({
  productId,
  slug,
  parentId,
  pageLoadedAt,
  onDone,
  placeholder,
  compact = false,
}: {
  productId: number
  slug: string
  parentId: number | null
  pageLoadedAt: number
  onDone?: () => void
  placeholder: string
  compact?: boolean
}) {
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return

    const formData = new FormData(e.currentTarget)
    const honeypot = (formData.get("website") as string) ?? ""

    startTransition(async () => {
      try {
        const result = await postComment(productId, slug, trimmed, parentId, honeypot, pageLoadedAt)
        if (result.error) {
          sileo.error({
            title: result.error,
            ...(result.resetMinutes
              ? { description: `Try again in ${result.resetMinutes} minute${result.resetMinutes > 1 ? "s" : ""}.` }
              : {}),
          })
        } else {
          setBody("")
          onDone?.()
        }
      } catch {
        sileo.error({ title: "Something went wrong" })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 opacity-0 pointer-events-none"
        aria-hidden
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={1000}
        rows={compact ? 2 : 3}
        className={`w-full resize-none rounded-lg border border-border/60 bg-transparent px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/35 focus:border-border focus:outline-none ${compact ? "text-[12px]" : ""}`}
      />

      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground/30 tabular-nums">
          {body.length > 0 ? `${body.length}/1000` : "\u00A0"}
        </span>
        <div className="flex items-center gap-2">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="text-[12px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="inline-flex h-7 items-center rounded-md bg-foreground px-3 text-[12px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-30"
          >
            {isPending ? "Posting..." : parentId ? "Reply" : "Comment"}
          </button>
        </div>
      </div>
    </form>
  )
}
