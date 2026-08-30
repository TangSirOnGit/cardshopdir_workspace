"use client"

import { useState, useTransition, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
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
  Shield,
  ShieldOff,
  Ban,
  ShieldCheck,
  Trash2,
  LogIn,
  KeyRound,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
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
import {
  banUser,
  unbanUser,
  deleteUser,
  setUserRole,
  revokeUserSessions,
} from "@/lib/actions/admin-users"
import { authClient } from "@/lib/auth-client"
import { sileo } from "sileo"
import {
  roleFilters,
  statusFilters,
  sortOptions,
  type RoleFilter,
  type StatusFilter,
  type SortOption,
} from "../search-params"

// ── Types ─────────────────────────────────────────────────────────

interface UserItem {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  banned: boolean
  banReason: string | null
  banExpires: string | null
  emailVerified: boolean
  createdAt: string
}

interface Props {
  users: UserItem[]
  total: number
  page: number
  totalPages: number
}

const ROLE_STYLES: Record<string, string> = {
  admin: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
  user: "text-muted-foreground bg-muted",
}

// ── Main ──────────────────────────────────────────────────────────

export function UserTable({ users, total, page, totalPages }: Props) {
  const [isLoading, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      role: parseAsStringEnum<RoleFilter>([...roleFilters]),
      status: parseAsStringEnum<StatusFilter>([...statusFilters]),
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

  // Modal states
  const [confirmAction, setConfirmAction] = useState<{
    type: "ban" | "unban" | "delete" | "promote" | "demote" | "revoke" | "impersonate"
    user: UserItem
  } | null>(null)
  const [banReason, setBanReason] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const openMenu = useCallback((userId: string) => {
    if (menuOpen === userId) {
      setMenuOpen(null)
      return
    }
    const btn = menuButtonRefs.current.get(userId)
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right - 192, // 192 = w-48
      })
    }
    setMenuOpen(userId)
  }, [menuOpen])

  function openAction(type: typeof confirmAction extends null ? never : NonNullable<typeof confirmAction>["type"], u: UserItem) {
    setMenuOpen(null)
    if (type === "ban") setBanReason("")
    setConfirmAction({ type, user: u })
  }

  function executeAction() {
    if (!confirmAction) return
    const { type, user: u } = confirmAction
    setConfirmAction(null)
    startAction(async () => {
      try {
        switch (type) {
          case "ban":
            await banUser(u.id, banReason || undefined)
            sileo.success({ title: `${u.name} banned` })
            break
          case "unban":
            await unbanUser(u.id)
            sileo.success({ title: `${u.name} unbanned` })
            break
          case "delete":
            await deleteUser(u.id)
            sileo.success({ title: `${u.name} deleted` })
            break
          case "promote":
            await setUserRole(u.id, "admin")
            sileo.success({ title: `${u.name} promoted to admin` })
            break
          case "demote":
            await setUserRole(u.id, "user")
            sileo.success({ title: `${u.name} demoted to user` })
            break
          case "revoke":
            await revokeUserSessions(u.id)
            sileo.success({ title: `Sessions revoked for ${u.name}` })
            break
          case "impersonate": {
            const { error: impError } = await authClient.admin.impersonateUser({
              userId: u.id,
            })
            if (impError) throw new Error(impError.message ?? "Failed to impersonate")
            window.location.href = "/"
            return
          }
        }
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Something went wrong",
        })
      }
    })
  }

  const dialogConfig = confirmAction
    ? {
        ban: {
          title: `Ban ${confirmAction.user.name}?`,
          description: "This user will be signed out and unable to sign in again until unbanned.",
          action: "Ban user",
          variant: "destructive" as const,
        },
        unban: {
          title: `Unban ${confirmAction.user.name}?`,
          description: "This user will be able to sign in again.",
          action: "Unban",
          variant: "default" as const,
        },
        delete: {
          title: `Delete ${confirmAction.user.name}?`,
          description: "This will permanently remove this user, their submissions, comments, and votes. This action cannot be undone.",
          action: "Delete user",
          variant: "destructive" as const,
        },
        promote: {
          title: `Promote ${confirmAction.user.name} to admin?`,
          description: "This user will have full access to the admin panel.",
          action: "Promote",
          variant: "default" as const,
        },
        demote: {
          title: `Remove admin from ${confirmAction.user.name}?`,
          description: "This user will lose access to the admin panel.",
          action: "Demote",
          variant: "destructive" as const,
        },
        revoke: {
          title: `Revoke all sessions for ${confirmAction.user.name}?`,
          description: "This user will be signed out of all devices immediately.",
          action: "Revoke sessions",
          variant: "destructive" as const,
        },
        impersonate: {
          title: `Impersonate ${confirmAction.user.name}?`,
          description: "You will be signed in as this user. The session expires after 1 hour or when you stop impersonating.",
          action: "Impersonate",
          variant: "default" as const,
        },
      }[confirmAction.type]
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Users</h1>
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
            placeholder="Search by name or email..."
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
            active={!filters.role && !filters.status}
            onClick={() => setFilters({ role: null, status: null, page: 1 })}
          />
          <StatusTab
            label="Admin"
            active={filters.role === "admin"}
            onClick={() =>
              setFilters({
                role: filters.role === "admin" ? null : "admin",
                status: null,
                page: 1,
              })
            }
          />
          <StatusTab
            label="Banned"
            active={filters.status === "banned"}
            onClick={() =>
              setFilters({
                status: filters.status === "banned" ? null : "banned",
                role: null,
                page: 1,
              })
            }
          />
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
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Table */}
      <div
        className={cn(
          "transition-opacity",
          (isLoading || actionPending) && "pointer-events-none opacity-50",
        )}
      >
        {users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
            <p className="text-[13px] text-muted-foreground">
              {localSearch || filters.role || filters.status
                ? "No users match your filters."
                : "No users yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[700px] text-[13px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <th className="py-2.5 pl-3 pr-2 font-medium">User</th>
                  <th className="px-2 py-2.5 font-medium">Role</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium">Joined</th>
                  <th className="py-2.5 pl-2 pr-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      u.banned && "opacity-60",
                    )}
                  >
                    {/* User */}
                    <td className="py-2.5 pl-3 pr-2">
                      <div className="flex items-center gap-3">
                        {u.image ? (
                          <Image
                            src={u.image}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 shrink-0 rounded-full ring-1 ring-border/50"
                          />
                        ) : (
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground ring-1 ring-border/50">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground/50">
                            {u.email}
                            {!u.emailVerified && (
                              <span className="ml-1 text-amber-500">(unverified)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          ROLE_STYLES[u.role] ?? ROLE_STYLES.user,
                        )}
                      >
                        {u.role === "admin" && (
                          <Shield className="size-2.5" />
                        )}
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-2.5">
                      {u.banned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                          <span className="size-1 rounded-full bg-red-500" />
                          banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="size-1 rounded-full bg-emerald-500" />
                          active
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 pl-2 pr-3">
                      <div className="relative flex items-center justify-end gap-1">
                        {/* Quick actions */}
                        {u.banned ? (
                          <button
                            type="button"
                            onClick={() => openAction("unban", u)}
                            disabled={actionPending}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                            title="Unban"
                            aria-label="Unban"
                          >
                            <ShieldCheck className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAction("ban", u)}
                            disabled={actionPending}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-orange-500/10 hover:text-orange-500"
                            title="Ban"
                            aria-label="Ban"
                          >
                            <Ban className="size-3.5" />
                          </button>
                        )}

                        {/* More menu */}
                        <button
                          ref={(el) => {
                            if (el) menuButtonRefs.current.set(u.id, el)
                          }}
                          type="button"
                          onClick={() => openMenu(u.id)}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                          title="More actions"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="size-3.5" />
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
        <UserPagination page={page} totalPages={totalPages} />
      )}

      {/* Dropdown portal */}
      {menuOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-90" onClick={() => setMenuOpen(null)} />
            <div
              className="fixed z-91 w-48 rounded-lg border border-border bg-popover py-1 shadow-lg"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {(() => {
                const u = users.find((u) => u.id === menuOpen)
                if (!u) return null
                return (
                  <>
                    {!u.banned && (
                      <MenuButton
                        icon={<LogIn className="size-3.5" />}
                        label="Impersonate"
                        onClick={() => openAction("impersonate", u)}
                      />
                    )}
                    {u.role === "admin" ? (
                      <MenuButton
                        icon={<ShieldOff className="size-3.5" />}
                        label="Remove admin"
                        onClick={() => openAction("demote", u)}
                      />
                    ) : (
                      <MenuButton
                        icon={<Shield className="size-3.5" />}
                        label="Make admin"
                        onClick={() => openAction("promote", u)}
                      />
                    )}
                    <MenuButton
                      icon={<KeyRound className="size-3.5" />}
                      label="Revoke sessions"
                      onClick={() => openAction("revoke", u)}
                    />
                    <div className="my-1 border-t border-border/60" />
                    <MenuButton
                      icon={<Trash2 className="size-3.5" />}
                      label="Delete user"
                      onClick={() => openAction("delete", u)}
                      destructive
                    />
                  </>
                )
              })()}
            </div>
          </>,
          document.body,
        )}

      {/* Confirm dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        {confirmAction && dialogConfig && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogConfig.description}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {confirmAction.type === "ban" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Spamming, Harassment..."
                  className="w-full rounded-lg bg-muted/50 px-4 py-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/40 focus:bg-muted"
                />
              </div>
            )}

            {confirmAction.type === "ban" &&
              confirmAction.user.banReason && (
                <p className="text-[12px] text-muted-foreground">
                  Previous ban reason: {confirmAction.user.banReason}
                </p>
              )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={dialogConfig.variant}
                onClick={executeAction}
              >
                {dialogConfig.action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  )
}

// ── Menu button ───────────────────────────────────────────────────

function MenuButton({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors",
        destructive
          ? "text-red-600 hover:bg-red-500/10 dark:text-red-400"
          : "text-foreground hover:bg-muted/50",
      )}
    >
      <span className="text-muted-foreground/60">{icon}</span>
      {label}
    </button>
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

function UserPagination({
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
