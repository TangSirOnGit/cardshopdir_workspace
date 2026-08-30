"use client"

import { useState, useTransition } from "react"
import { Check, X, ImageOff } from "lucide-react"
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
import { updateSubmissionStatus } from "@/lib/actions/admin"
import { sileo } from "sileo"

type ActionStatus = "accepted" | "rejected" | "revision"

const ACTION_CONFIG: Record<
  ActionStatus,
  {
    title: string
    description: (name: string, tier: string) => string
    confirm: string
  }
> = {
  accepted: {
    title: "Accept this submission?",
    description: (name, tier) =>
      tier === "free"
        ? `"${name}" will be queued for the next available batch. The submitter will be notified.`
        : `"${name}" (${tier}) will be added to the next weekly batch with priority. The submitter will be notified.`,
    confirm: "Accept",
  },
  rejected: {
    title: "Reject this submission?",
    description: (name, tier) =>
      tier !== "free"
        ? `"${name}" will be rejected. You'll get a link to issue the refund manually on Stripe. The submitter will be notified.`
        : `"${name}" will be rejected. The submitter will be notified.`,
    confirm: "Reject",
  },
  revision: {
    title: "Request a new image?",
    description: (name) =>
      `The submitter of "${name}" will be asked to provide a new thumbnail. They'll have until next Sunday.`,
    confirm: "Request revision",
  },
}

interface SubmissionActionsProps {
  id: number
  name: string
  tier: string
  mode: "pending" | "revision"
}

export function SubmissionActions({ id, name, tier, mode }: SubmissionActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<ActionStatus | null>(null)

  function execute(status: ActionStatus) {
    setConfirm(null)
    startTransition(async () => {
      try {
        const result = await updateSubmissionStatus(id, status)
        if (result.stripePaymentUrl) {
          window.open(result.stripePaymentUrl, "_blank")
          sileo.info({ title: "Refund needed. Stripe opened in new tab" })
        }
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Something went wrong",
        })
      }
    })
  }

  return (
    <>
      <div className="flex shrink-0 gap-1">
        <button
          disabled={isPending}
          onClick={() => setConfirm("accepted")}
          title="Accept"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-30"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        {mode === "pending" && (
          <button
            disabled={isPending}
            onClick={() => setConfirm("revision")}
            title="Request new image"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-500 disabled:opacity-30"
          >
            <ImageOff className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          disabled={isPending}
          onClick={() => setConfirm("rejected")}
          title="Reject"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        {confirm && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{ACTION_CONFIG[confirm].title}</AlertDialogTitle>
              <AlertDialogDescription>
                {ACTION_CONFIG[confirm].description(name, tier)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => execute(confirm)}>
                {ACTION_CONFIG[confirm].confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  )
}
