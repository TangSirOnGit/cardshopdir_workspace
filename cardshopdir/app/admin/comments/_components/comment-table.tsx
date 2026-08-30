"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import {
  useQueryStates,
  useQueryState,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs"
import { throttle } from "nuqs"
import { format } from "date-fns"
import {
  Search,
  X,
  Check,
  Trash2,
  Reply,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { adminUpdateComment, adminDeleteComment } from "@/lib/actions/comment"
import { sileo } from "sileo"
import Link from "next/link"
import {
  commentStatuses,
  sortOptions,
  type CommentStatus,
  type SortOption,
} from "../search-params"

// ── Types ─────────────────────────────────────────────────────────

interface CommentItem {
  id: number
  body: string
  status: "approved" | "rejected"
  parentId: number | null
  createdAt: string
  userName: string
  userEmail: string
  productName: string
  productSlug: string
}

interface Props {
  comments: CommentItem[]
  total: number
  page: number
  totalPages: number
}

const STATUS_STYLES: Record<string, string> = {
  approved: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  rejected: "text-red-600 bg-red-500/10 dark:text-red-400",
}

// ── Main ──────────────────────────────────────────────────────────

export function CommentTable({ comments, total, page, totalPages }: Props) {
  const [isLoading, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      status: parseAsStringEnum<CommentStatus>([...commentStatuses]),
      sort: parseAsStringEnum<SortOption>([...sortOptions]).withDefault("newest"),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false, startTransition, limitUrlUpdates: throttle(500) },
  )

  const [localSearch, setLocalSearch] = useState(filters.q)
  useEffect(() => {
    if (localSearch !== filters.q) setFilters({ q: localSearch, page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])
  useEffect(() => {
    setLocalSearch(filters.q)
  }, [filters.q])

  const [actionPending, startAction] = useTransition()
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "delete"
    comment: CommentItem
  } | null>(null)

  function executeAction() {
    if (!confirmAction) return
    const { type, comment } = confirmAction
    setConfirmAction(null)
    startAction(async () => {
      try {
        if (type === "delete") {
          await adminDeleteComment(comment.id)
          sileo.success({ title: "Comment deleted" })
        } else {
          await adminUpdateComment(
            comment.id,
            type === "approve" ? "approved" : "rejected",
          )
          sileo.success({
            title: `Comment ${type === "approve" ? "approved" : "rejected"}`,
          })
        }
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Something went wrong",
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Comments</h1>
        <span className="text-[12px] tabular-nums text-muted-foreground/60">
          {total} total
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search comments, users, products..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full rounded-lg bg-muted/50 py-2 pl-9 pr-8 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/40 focus:bg-muted"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("")
                searchRef.current?.focus()
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
          <StatusTab
            label="All"
            active={!filters.status}
            onClick={() => setFilters({ status: null, page: 1 })}
          />
          {commentStatuses.map((s) => (
            <StatusTab
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={filters.status === s}
              onClick={() =>
                setFilters({
                  status: filters.status === s ? null : s,
                  page: 1,
                })
              }
            />
          ))}
        </div>

        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters({ sort: e.target.value as SortOption, page: 1 })
          }
          className="rounded-lg bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground outline-none transition-colors focus:bg-muted"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Table */}
      <div
        className={cn(
          "transition-opacity",
          (isLoading || actionPending) && "pointer-events-none opacity-50",
        )}
      >
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
            <p className="text-[13px] text-muted-foreground">
              {localSearch || filters.status
                ? "No comments match your filters."
                : "No comments yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[700px] text-[13px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <th className="py-2.5 pl-3 pr-2 font-medium">Comment</th>
                  <th className="px-2 py-2.5 font-medium">Product</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium">Date</th>
                  <th className="py-2.5 pl-2 pr-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {comments.map((comment) => (
                  <tr
                    key={comment.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Comment + author */}
                    <td className="max-w-xs py-2.5 pl-3 pr-2">
                      <div className="flex items-start gap-2">
                        {comment.parentId ? (
                          <Reply className="mt-0.5 size-3 shrink-0 text-muted-foreground/40" />
                        ) : (
                          <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground/40" />
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[13px] leading-snug">
                            {comment.body}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/50">
                            {comment.userName}
                            {comment.userEmail && (
                              <span className="text-muted-foreground/30">
                                {" "}
                                &middot; {comment.userEmail}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-2 py-2.5">
                      <Link
                        href={`/p/${comment.productSlug}`}
                        className="truncate text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {comment.productName}
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_STYLES[comment.status],
                        )}
                      >
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            comment.status === "approved" && "bg-emerald-500",
                            comment.status === "rejected" && "bg-red-500",
                          )}
                        />
                        {comment.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                      {format(new Date(comment.createdAt), "MMM d")}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 pl-2 pr-3">
                      <div className="flex items-center justify-end gap-1">
                        {comment.status === "rejected" && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: "approve",
                                comment,
                              })
                            }
                            disabled={actionPending}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                            title="Approve"
                            aria-label="Approve"
                          >
                            <Check className="size-3.5" />
                          </button>
                        )}
                        {comment.status === "approved" && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: "reject",
                                comment,
                              })
                            }
                            disabled={actionPending}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-orange-500/10 hover:text-orange-500"
                            title="Reject"
                            aria-label="Reject"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/p/${comment.productSlug}`}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                          title="View product"
                          aria-label="View product"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: "delete",
                              comment,
                            })
                          }
                          disabled={actionPending}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <CommentPagination page={page} totalPages={totalPages} />
      )}

      {/* Confirm dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        {confirmAction && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction.type === "delete"
                  ? "Delete comment?"
                  : confirmAction.type === "approve"
                    ? "Approve comment?"
                    : "Reject comment?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction.type === "delete"
                  ? "This will permanently delete this comment and all its replies."
                  : confirmAction.type === "approve"
                    ? "This comment will become visible on the product page."
                    : "This comment will be hidden from the product page."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={
                  confirmAction.type === "delete" ? "destructive" : "default"
                }
                onClick={executeAction}
              >
                {confirmAction.type === "delete"
                  ? "Delete"
                  : confirmAction.type === "approve"
                    ? "Approve"
                    : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  )
}

// ── StatusTab ─────────────────────────────────────────────────────

function StatusTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-background text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

// ── Pagination ────────────────────────────────────────────────────

function CommentPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  )

  function getPages(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | "...")[] = [1]
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    if (start > 2) pages.push("...")
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push("...")
    pages.push(total)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      {getPages(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span
            key={`e-${i}`}
            className="flex size-8 items-center justify-center text-[12px] text-muted-foreground/40"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-[12px] tabular-nums transition-colors",
              p === page
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {p}
          </button>
        ),
      )}
    </div>
  )
}
