"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteSubmission } from "@/lib/actions/admin"
import { sileo } from "sileo"

interface DeleteSubmissionProps {
  id: number
  name: string
  hasProduct: boolean
}

export function DeleteSubmission({ id, name, hasProduct }: DeleteSubmissionProps) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [isPending, startTransition] = useTransition()

  const canDelete = confirmation === name

  function handleDelete() {
    if (!canDelete) return
    startTransition(async () => {
      try {
        await deleteSubmission(id)
        setOpen(false)
        setConfirmation("")
        sileo.success({ title: "Submission deleted" })
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Something went wrong",
        })
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Delete"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-500"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <AlertDialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setConfirmation("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will permanently delete <strong>&quot;{name}&quot;</strong>
                  {hasProduct && " and its published product page"}.
                  This action cannot be undone.
                </p>
                <p>
                  Type <strong>{name}</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder={name}
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-red-500"
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {isPending ? "Deleting..." : "Delete permanently"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
