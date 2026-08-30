"use client"

import { useState } from "react"

import { Loader2, ImagePlus, X, Check, Minus, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { DescriptionEditor } from "@/components/description-editor"
import { useSearchParams } from "next/navigation"
import { sileo } from "sileo"

type Tier = "free" | "boost" | "highlight"
type Step = "form" | "tier"

const TIER_FEATURES: Record<Tier, { included: string[]; excluded: string[] }> =
  {
    free: {
      included: [
        "Listed in a weekly batch",
        "Dofollow backlink if top 3",
        "Newsletter mention if top 3",
      ],
      excluded: ["Pinned on homepage", "Instant publishing"],
    },
    boost: {
      included: [
        "Guaranteed placement in next batch",
        "Permanent dofollow backlink",
        "Guaranteed newsletter mention",
        "Skip moderation queue",
      ],
      excluded: ["Pinned on homepage"],
    },
    highlight: {
      included: [
        "Published instantly",
        "Pinned on homepage for 7 days",
        "Permanent dofollow backlink",
        "Guaranteed newsletter mention",
        "Skip moderation queue",
      ],
      excluded: [],
    },
  }

function formatFreeWait(days: number): string {
  if (days <= 7) {
    return `${days} day${days > 1 ? "s" : ""} from now`
  }
  const weeks = Math.round(days / 7)
  return `~${weeks} week${weeks > 1 ? "s" : ""} queue · skip with Boost`
}

function getTierLaunchInfo(
  tier: Tier,
  freeLaunchDate: string,
  boostLaunchDate: string,
  freeWaitDays: number
): { label: string; detail: string } {
  switch (tier) {
    case "free":
      return {
        label: `Launches ${freeLaunchDate}`,
        detail: formatFreeWait(freeWaitDays),
      }
    case "boost":
      return {
        label: `Launches ${boostLaunchDate}`,
        detail: "next batch",
      }
    case "highlight":
      return {
        label: "Live today",
        detail: "published instantly",
      }
  }
}

interface Draft {
  id: number
  name: string
  tier: "free" | "boost" | "highlight"
  thumbnailUrl: string
}

interface SubmitFormProps {
  freeLaunchDate: string
  boostLaunchDate: string
  freeWaitDays: number
  boostPrice: string
  highlightPrice: string
  user: { name: string } | null
  drafts: Draft[]
}

export function SubmitForm({
  freeLaunchDate,
  boostLaunchDate,
  freeWaitDays,
  boostPrice,
  highlightPrice,
  drafts,
}: SubmitFormProps) {
  const TIERS: { id: Tier; name: string; price: string }[] = [
    { id: "free", name: "Free", price: "$0" },
    { id: "boost", name: "Boost", price: boostPrice },
    { id: "highlight", name: "Highlight", price: highlightPrice },
  ]
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("form")
  const [name, setName] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const initialTier = (["free", "boost", "highlight"] as const).includes(
    searchParams.get("tier") as Tier
  )
    ? (searchParams.get("tier") as Tier)
    : "free"
  const [selectedTier, setSelectedTier] = useState<Tier>(initialTier)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resumingDraftId, setResumingDraftId] = useState<number | null>(null)

  const success = searchParams.get("success")
  const successTier = searchParams.get("tier") as Tier | null
  const canceled = searchParams.get("canceled")
  const isRetry = searchParams.get("retry")

  if (success) {
    const isHighlight = successTier === "highlight"
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-[340px] flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[14px] font-medium">
              {isHighlight ? "You're live!" : "You're in the next batch"}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isHighlight
                ? "Your product is now featured on the homepage for 7 days."
                : "Your product is guaranteed a spot in the next weekly launch. We'll notify you by email when it goes live."}
            </p>
          </div>
          <a
            href="/profile"
            className="rounded-full bg-foreground px-5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
          >
            View my submissions
          </a>
        </div>
      </div>
    )
  }

  if (canceled || (isRetry && drafts.length > 0)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-[340px] flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[14px] font-medium">
              {drafts.length === 1
                ? "Complete your payment"
                : "Complete a payment"}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {drafts.length === 1
                ? "Your submission is saved as a draft. Complete payment to proceed."
                : `You have ${drafts.length} drafts awaiting payment.`}
            </p>
          </div>
          <div className="w-full space-y-2">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                disabled={resumingDraftId === draft.id}
                onClick={async () => {
                  setResumingDraftId(draft.id)
                  try {
                    const res = await fetch("/api/stripe/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ submissionId: draft.id }),
                    })
                    const { url: checkoutUrl } = await res.json()
                    if (checkoutUrl) {
                      window.location.href = checkoutUrl
                    } else {
                      sileo.error({ title: "Could not start checkout" })
                      setResumingDraftId(null)
                    }
                  } catch {
                    sileo.error({ title: "Something went wrong" })
                    setResumingDraftId(null)
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <span className="flex-1 truncate text-[13px] font-medium">
                  {draft.name}
                </span>
                <span className="shrink-0 text-[12px] text-muted-foreground">
                  {draft.tier === "boost" ? boostPrice : highlightPrice}
                </span>
                {resumingDraftId === draft.id ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0 rotate-180 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.history.replaceState({}, "", "/submit")}
            className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Submit a new product instead
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-[340px] flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[14px] font-medium">Submitted</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              We&apos;ll review your product and let you know by email.
            </p>
          </div>
          <a
            href="/profile"
            className="rounded-full bg-foreground px-5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
          >
            View my submissions
          </a>
        </div>
      </div>
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
  }

  function handleFormNext(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !url || !name) return
    setStep("tier")
  }

  async function handleSubmit() {
    if (!file || !url || !name) return
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        sileo.error({ title: "Upload failed" })
        return
      }

      const { url: thumbnailUrl } = await uploadRes.json()

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline: tagline || undefined,
          description: description || undefined,
          websiteUrl: url,
          thumbnailUrl,
          tier: selectedTier,
        }),
      })

      if (!res.ok) {
        await res.json().catch(() => null)
        sileo.error({
          title:
            res.status === 409
              ? "You already submitted this product"
              : "Something went wrong",
        })
        return
      }

      const submission = await res.json()

      if (selectedTier === "free") {
        sileo.success({ title: "Product submitted" })
        setSubmitted(true)
        return
      }

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id }),
      })

      const { url: checkoutUrl } = await checkoutRes.json()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        sileo.error({ title: "Could not start checkout" })
      }
    } catch {
      sileo.error({ title: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "tier") {
    const launchInfo = getTierLaunchInfo(
      selectedTier,
      freeLaunchDate,
      boostLaunchDate,
      freeWaitDays
    )

    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-[340px] space-y-5">
          <button
            onClick={() => setStep("form")}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>

          <div className="space-y-2">
            {TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "bg-foreground text-background"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <span className="text-[14px] font-medium">{tier.name}</span>
                  <span
                    className={cn(
                      "text-[13px]",
                      isSelected
                        ? "text-background/60"
                        : "text-muted-foreground"
                    )}
                  >
                    {tier.price}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Launch date — always 2 lines, fixed height */}
          <div
            className={cn(
              "rounded-xl px-4 py-3",
              selectedTier === "highlight"
                ? "bg-emerald-500/10"
                : selectedTier === "boost"
                  ? "bg-blue-500/10"
                  : "bg-muted/50"
            )}
          >
            <p
              className={cn(
                "text-[14px] font-semibold",
                selectedTier === "highlight" &&
                  "text-emerald-600 dark:text-emerald-400",
                selectedTier === "boost" && "text-blue-600 dark:text-blue-400"
              )}
            >
              {launchInfo.label}
            </p>
            <p
              className={cn(
                "text-[12px]",
                selectedTier === "free"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {launchInfo.detail}
            </p>
          </div>

          <ul className="space-y-1.5 px-1">
            {TIER_FEATURES[selectedTier].included.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-[12px] text-muted-foreground"
              >
                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
            {TIER_FEATURES[selectedTier].excluded.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-[12px] text-muted-foreground/30"
              >
                <Minus className="h-3 w-3 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            {submitting ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : selectedTier === "free" ? (
              "Submit"
            ) : (
              `Continue to payment - ${TIERS.find((t) => t.id === selectedTier)?.price}`
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center py-8 sm:py-10">
      <form
        onSubmit={handleFormNext}
        className="w-full max-w-[340px] space-y-5"
      >
        <div>
          {preview ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Thumbnail preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2.5 right-2.5 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="thumbnail"
              className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[13px]">Upload thumbnail</span>
              <span className="text-[11px] text-muted-foreground/80">
                1280 &times; 720px (16:9)
              </span>
              <input
                id="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground/80">
            This is exactly how it will appear on your product page.
          </p>
        </div>

        <input
          type="text"
          required
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
        />

        <input
          type="text"
          required
          placeholder="Tagline"
          aria-label="Tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
        />

        <DescriptionEditor onChange={setDescription} />

        <input
          type="url"
          required
          placeholder="https://yourproduct.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
        />

        <button
          type="submit"
          disabled={!file || !url || !name || !tagline}
          className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          Next
        </button>
      </form>
    </div>
  )
}
