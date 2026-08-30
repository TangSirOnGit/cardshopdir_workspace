"use client"

import { useState, useTransition, useRef } from "react"
import { createManualSponsor, updateSponsor, deleteSponsor } from "./actions"
import { DatePicker } from "@/components/date-picker"
import { sileo } from "sileo"
import { Loader2, ImagePlus, X, Trash2 } from "lucide-react"
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
import { format, differenceInDays } from "date-fns"

interface SponsorData {
  id: number
  name: string
  tagline: string
  websiteUrl: string
  email: string
  imageUrl: string | null
  startsAt: string
  endsAt: string
}

export function SponsorForm({ sponsor }: { sponsor?: SponsorData }) {
  const isEdit = !!sponsor

  const [name, setName] = useState(sponsor?.name ?? "")
  const [tagline, setTagline] = useState(sponsor?.tagline ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(sponsor?.websiteUrl ?? "")
  const [email, setEmail] = useState(sponsor?.email ?? "")
  const [imageUrl, setImageUrl] = useState(sponsor?.imageUrl ?? "")
  const [startDate, setStartDate] = useState<Date | undefined>(
    sponsor ? new Date(sponsor.startsAt + "T00:00:00") : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    sponsor ? new Date(sponsor.endsAt + "T00:00:00") : undefined,
  )
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const days =
    startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/sponsor/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      setImageUrl(url)
      sileo.success({ title: "Logo uploaded" })
    } catch {
      sileo.error({ title: "Upload failed" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleSubmit() {
    if (
      !name.trim() ||
      !websiteUrl.trim() ||
      !email.trim() ||
      !startDate ||
      !endDate
    ) {
      sileo.error({ title: "Fill in all required fields" })
      return
    }

    const data = {
      name,
      tagline,
      websiteUrl,
      email,
      imageUrl,
      startsAt: format(startDate, "yyyy-MM-dd"),
      endsAt: format(endDate, "yyyy-MM-dd"),
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateSponsor(sponsor.id, data)
          sileo.success({ title: "Sponsor updated" })
        } else {
          await createManualSponsor(data)
        }
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Something went wrong",
        })
      }
    })
  }

  function confirmDelete() {
    if (!sponsor) return
    setShowDeleteModal(false)
    startTransition(async () => {
      try {
        await deleteSponsor(sponsor.id)
      } catch {
        sileo.error({ title: "Failed to delete" })
      }
    })
  }

  const isValid =
    name.trim() && websiteUrl.trim() && email.trim() && startDate && endDate && days > 0

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">
            Brand name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
            maxLength={100}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@company.com"
            className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium">Tagline</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Ship faster with our dev tools"
          className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
          maxLength={200}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium">
          Website URL
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://acme.com"
          className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
        />
      </div>

      {/* Dates */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">
            Start date
          </label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Pick start date"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">
            End date
          </label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Pick end date"
          />
        </div>
      </div>
      {days > 0 && (
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {days} day{days !== 1 ? "s" : ""} selected
        </p>
      )}

      {/* Logo */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium">
          Logo <span className="text-muted-foreground/50">(optional)</span>
        </label>
        {imageUrl ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
              <Image
                src={imageUrl}
                alt="Logo preview"
                fill
                className="object-cover"
              />
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
              {imageUrl}
            </span>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              aria-label="Remove logo"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 py-3 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Upload logo
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isPending || uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isEdit ? "Update sponsor" : "Create sponsor"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sponsor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the sponsor from the site immediately.
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
