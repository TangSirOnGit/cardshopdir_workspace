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
import Image from "next/image"
import {
  Search,
  X,
  ExternalLink,
  Check,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { appendUtm } from "@/lib/utm"
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
  updateSubmissionStatus,
  updateSubmissionFields,
  deleteSubmission,
  getAvailableWeeks,
  acceptSubmission,
} from "@/lib/actions/admin"
import { sileo } from "sileo"
import { format } from "date-fns"
import {
  statuses,
  sortOptions,
  type Status,
  type SortOption,
} from "./search-params"

interface Submission {
  id: number
  name: string
  tagline: string | null
  description: string | null
  websiteUrl: string
  thumbnailUrl: string
  logoUrl: string | null
  tier: string
  status: string
  scheduledWeek: number | null
  scheduledYear: number | null
  revisionReasons: string | null
  createdAt: Date
  userName: string | null
  userEmail: string | null
}

interface Props {
  submissions: Submission[]
  total: number
  page: number
  totalPages: number
}

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  revision: "text-orange-600 bg-orange-500/10 dark:text-orange-400",
  accepted: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  rejected: "text-red-600 bg-red-500/10 dark:text-red-400",
  draft: "text-muted-foreground bg-muted",
}

const TIER_STYLES: Record<string, string> = {
  free: "text-muted-foreground bg-muted",
  boost: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
  highlight: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
}

const REVISION_PRESETS = [
  { id: "thumbnail", label: "Thumbnail quality too low" },
  { id: "info", label: "Name or tagline needs improvement" },
  { id: "url", label: "Website URL is broken or redirects" },
  { id: "description", label: "Description is too vague or missing" },
]

export function SubmissionList({ submissions, total, page, totalPages }: Props) {
  const [isLoading, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      status: parseAsStringEnum<Status>(statuses),
      sort: parseAsStringEnum<SortOption>(sortOptions).withDefault("newest"),
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

  // Modal states
  const [previewModal, setPreviewModal] = useState<Submission | null>(null)
  const [acceptModal, setAcceptModal] = useState<Submission | null>(null)
  const [rejectModal, setRejectModal] = useState<Submission | null>(null)
  const [revisionModal, setRevisionModal] = useState<Submission | null>(null)
  const [editModal, setEditModal] = useState<Submission | null>(null)
  const [deleteModal, setDeleteModal] = useState<Submission | null>(null)
  const [revisionChecked, setRevisionChecked] = useState<string[]>([])
  const [revisionOther, setRevisionOther] = useState("")
  const [availableWeeks, setAvailableWeeks] = useState<
    Awaited<ReturnType<typeof getAvailableWeeks>>
  >([])
  const [selectedWeek, setSelectedWeek] = useState<{
    week: number
    year: number
  } | null>(null)
  const [loadingWeeks, setLoadingWeeks] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", tagline: "", websiteUrl: "" })
  const [actionPending, startActionTransition] = useTransition()

  function openRevision(sub: Submission) {
    setRevisionChecked([])
    setRevisionOther("")
    setRevisionModal(sub)
  }

  function submitRevision() {
    if (!revisionModal) return
    const reasons = [
      ...revisionChecked.map(
        (id) => REVISION_PRESETS.find((p) => p.id === id)?.label ?? id,
      ),
      ...(revisionOther.trim() ? [revisionOther.trim()] : []),
    ]
    if (reasons.length === 0) {
      sileo.error({ title: "Select at least one reason" })
      return
    }
    setRevisionModal(null)
    startActionTransition(async () => {
      try {
        await updateSubmissionStatus(revisionModal.id, "revision", reasons)
        sileo.success({ title: "Revision requested" })
      } catch {
        sileo.error({ title: "Failed" })
      }
    })
  }

  function openEdit(sub: Submission) {
    setEditForm({
      name: sub.name,
      tagline: sub.tagline ?? "",
      websiteUrl: sub.websiteUrl,
    })
    setEditModal(sub)
  }

  function submitEdit() {
    if (!editModal) return
    setEditModal(null)
    startActionTransition(async () => {
      try {
        await updateSubmissionFields(editModal.id, editForm)
        sileo.success({ title: "Submission updated" })
      } catch {
        sileo.error({ title: "Failed to update" })
      }
    })
  }

  async function openAcceptModal(sub: Submission) {
    setAcceptModal(sub)
    setEditingSchedule(false)
    setLoadingWeeks(true)
    setSelectedWeek(null)
    try {
      const weeks = await getAvailableWeeks(sub.tier)
      setAvailableWeeks(weeks)
      const auto = weeks.find((w) => w.isRecommended)
      if (auto) setSelectedWeek({ week: auto.week, year: auto.year })
    } catch {
      sileo.error({ title: "Failed to load schedule" })
    } finally {
      setLoadingWeeks(false)
    }
  }

  function confirmAccept() {
    if (!acceptModal || !selectedWeek) return
    const sub = acceptModal
    const week = selectedWeek
    setAcceptModal(null)
    startActionTransition(async () => {
      try {
        await acceptSubmission(sub.id, week.week, week.year)
        sileo.success({ title: `${sub.name} accepted` })
      } catch {
        sileo.error({ title: "Failed" })
      }
    })
  }

  function confirmReject() {
    if (!rejectModal) return
    const sub = rejectModal
    setRejectModal(null)
    startActionTransition(async () => {
      try {
        const result = await updateSubmissionStatus(sub.id, "rejected")
        if (result.stripePaymentUrl) {
          window.open(result.stripePaymentUrl, "_blank")
          sileo.info({ title: "Rejected. Stripe refund opened" })
        } else {
          sileo.success({ title: `${sub.name} rejected` })
        }
      } catch {
        sileo.error({ title: "Failed" })
      }
    })
  }

  function confirmDelete() {
    if (!deleteModal) return
    setDeleteModal(null)
    startActionTransition(async () => {
      try {
        await deleteSubmission(deleteModal.id)
      } catch {
        sileo.error({ title: "Failed to delete" })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Submissions</h1>
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
            placeholder="Search submissions..."
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
          {statuses.map((s) => (
            <StatusTab
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              active={filters.status === s}
              onClick={() =>
                setFilters({ status: filters.status === s ? null : s, page: 1 })
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
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div
        className={cn(
          "transition-opacity",
          (isLoading || actionPending) && "pointer-events-none opacity-50",
        )}
      >
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
            <p className="text-[13px] text-muted-foreground">
              {localSearch || filters.status
                ? "No submissions match your filters."
                : "No submissions yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[700px] text-[13px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground/70">
                  <th className="py-2.5 pl-3 pr-2 font-medium">Submission</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium">Tier</th>
                  <th className="px-2 py-2.5 font-medium">Schedule</th>
                  <th className="px-2 py-2.5 font-medium">Date</th>
                  <th className="py-2.5 pl-2 pr-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModal(sub)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                          <Image
                            src={sub.thumbnailUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium underline decoration-transparent transition-colors group-hover:decoration-foreground/30">{sub.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground/60">
                            {sub.userName ?? "Unknown"}{" "}
                            {sub.userEmail && (
                              <span className="text-muted-foreground/40">
                                · {sub.userEmail}
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_STYLES[sub.status] ?? STATUS_STYLES.draft,
                        )}
                      >
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            sub.status === "pending" && "bg-amber-500",
                            sub.status === "revision" && "bg-orange-500",
                            sub.status === "accepted" && "bg-emerald-500",
                            sub.status === "rejected" && "bg-red-500",
                            sub.status === "draft" && "bg-muted-foreground/60",
                          )}
                        />
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          TIER_STYLES[sub.tier] ?? TIER_STYLES.free,
                        )}
                      >
                        {sub.tier}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {sub.scheduledWeek && sub.scheduledYear
                        ? `W${sub.scheduledWeek} ${sub.scheduledYear}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums text-muted-foreground">
                      {format(sub.createdAt, "MMM d")}
                    </td>
                    <td className="py-2.5 pl-2 pr-3">
                      <div className="flex items-center justify-end gap-1">
                        {(sub.status === "pending" ||
                          sub.status === "revision") && (
                          <>
                            <button
                              onClick={() => openAcceptModal(sub)}
                              disabled={actionPending}
                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                              title="Accept"
                              aria-label="Accept"
                            >
                              <Check className="size-3.5" />
                            </button>
                            {sub.status === "pending" && (
                              <button
                                onClick={() => openRevision(sub)}
                                disabled={actionPending}
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-orange-500/10 hover:text-orange-500"
                                title="Request revision"
                                aria-label="Request revision"
                              >
                                <RotateCcw className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setRejectModal(sub)}
                              disabled={actionPending}
                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                              title="Reject"
                              aria-label="Reject"
                            >
                              <X className="size-3.5" />
                            </button>
                          </>
                        )}
                        {(sub.status === "pending" ||
                          sub.status === "revision" ||
                          sub.status === "accepted") && (
                          <button
                            onClick={() => openEdit(sub)}
                            disabled={actionPending}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        <a
                          href={appendUtm(sub.websiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                          title="Visit website"
                          aria-label="Visit website"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteModal(sub)}
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

      {totalPages > 1 && (
        <SubmissionPagination page={page} totalPages={totalPages} />
      )}

      {/* Preview */}
      <AlertDialog open={!!previewModal} onOpenChange={(o) => !o && setPreviewModal(null)}>
        <AlertDialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          {/* Thumbnail — same as product detail page */}
          {previewModal?.thumbnailUrl && (
            <div className="relative aspect-video w-full bg-muted">
              <Image
                src={previewModal.thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 640px) 672px, 100vw"
              />
            </div>
          )}

          <div className="space-y-4 p-5">
            {/* Header */}
            <AlertDialogHeader className="space-y-0">
              <AlertDialogTitle className="flex items-center gap-2.5">
                {previewModal?.logoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewModal.logoUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-lg bg-muted object-contain"
                  />
                )}
                <span className="font-serif text-xl tracking-tight">
                  {previewModal?.name}
                </span>
              </AlertDialogTitle>
              <AlertDialogDescription className={previewModal?.tagline ? "text-[14px] leading-relaxed" : "sr-only"}>
                {previewModal?.tagline || "Submission preview"}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Description — same prose-description class as product page */}
            {previewModal?.description && (
              <div
                className="prose-description max-h-64 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewModal.description }}
              />
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", TIER_STYLES[previewModal?.tier ?? "free"])}>
                {previewModal?.tier}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[previewModal?.status ?? "draft"])}>
                {previewModal?.status}
              </span>
              {previewModal?.userName && (
                <span>{previewModal.userName}</span>
              )}
              {previewModal?.createdAt && (
                <span>{format(previewModal.createdAt, "MMM d, yyyy")}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <a
                href={previewModal?.websiteUrl ? appendUtm(previewModal.websiteUrl) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium transition-colors hover:bg-muted"
              >
                <ExternalLink className="size-3.5" />
                Visit website
              </a>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept with schedule */}
      <AlertDialog open={!!acceptModal} onOpenChange={(o) => !o && setAcceptModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept {acceptModal?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This product will be accepted and scheduled for launch.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {loadingWeeks ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : editingSchedule ? (
            <div className="max-h-52 space-y-1 overflow-y-auto">
              {availableWeeks.map((w) => {
                const isSelected =
                  selectedWeek?.week === w.week && selectedWeek?.year === w.year
                const isFull =
                  acceptModal?.tier === "free" && w.slotsUsed >= w.slotsTotal
                return (
                  <button
                    key={`${w.year}-${w.week}`}
                    type="button"
                    disabled={isFull}
                    onClick={() => {
                      setSelectedWeek({ week: w.week, year: w.year })
                      setEditingSchedule(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                      isSelected
                        ? "bg-foreground text-background"
                        : isFull
                          ? "bg-muted/20 text-muted-foreground/30"
                          : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span>{w.label}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] tabular-nums",
                        isSelected
                          ? "text-background/60"
                          : isFull
                            ? "text-red-400"
                            : "text-muted-foreground/50",
                      )}
                    >
                      {w.slotsUsed}/{w.slotsTotal === 999 ? "∞" : w.slotsTotal}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : selectedWeek ? (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-[13px]">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {availableWeeks.find(
                    (w) =>
                      w.week === selectedWeek.week &&
                      w.year === selectedWeek.year,
                  )?.label ?? `W${selectedWeek.week} ${selectedWeek.year}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchedule(true)}
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Change
              </button>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAccept}
              disabled={!selectedWeek || loadingWeeks}
            >
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog open={!!rejectModal} onOpenChange={(o) => !o && setRejectModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {rejectModal?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectModal?.tier !== "free"
                ? "This is a paid submission. A Stripe refund link will open after rejection."
                : "This submission will be permanently rejected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmReject}>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision */}
      <AlertDialog open={!!revisionModal} onOpenChange={(o) => !o && setRevisionModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request revision</AlertDialogTitle>
            <AlertDialogDescription>
              Select the reason(s) for &ldquo;{revisionModal?.name}&rdquo;. The
              user will see these in their profile and can edit once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {REVISION_PRESETS.map((preset) => (
              <label key={preset.id} className="flex items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={revisionChecked.includes(preset.id)}
                  onChange={(e) =>
                    setRevisionChecked((prev) =>
                      e.target.checked
                        ? [...prev, preset.id]
                        : prev.filter((id) => id !== preset.id),
                    )
                  }
                  className="size-4 rounded border-border accent-foreground"
                />
                {preset.label}
              </label>
            ))}
            <input
              type="text"
              placeholder="Other reason (optional)"
              value={revisionOther}
              onChange={(e) => setRevisionOther(e.target.value)}
              className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitRevision}>
              Request revision
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit */}
      <AlertDialog open={!!editModal} onOpenChange={(o) => !o && setEditModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit submission</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Tagline</label>
              <input
                value={editForm.tagline}
                onChange={(e) => setEditForm((f) => ({ ...f, tagline: e.target.value }))}
                className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Website URL</label>
              <input
                value={editForm.websiteUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitEdit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete */}
      <AlertDialog open={!!deleteModal} onOpenChange={(o) => !o && setDeleteModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteModal?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

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

function SubmissionPagination({
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

  function getPages(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | "…")[] = [1]
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    if (start > 2) pages.push("…")
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push("…")
    pages.push(total)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      {getPages(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span
            key={`e-${i}`}
            className="flex size-8 items-center justify-center text-[12px] text-muted-foreground/40"
          >
            …
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
