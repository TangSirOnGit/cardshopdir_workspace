"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Loader2 } from "lucide-react"
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
import { updateProduct, deleteProduct } from "@/lib/actions/admin"
import { sileo } from "sileo"

interface ProductActionsProps {
  product: { id: number; name: string; websiteUrl: string }
}

export function ProductActions({ product }: ProductActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: product.name,
    websiteUrl: product.websiteUrl,
  })
  const [deleting, setDeleting] = useState(false)

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProduct(product.id, editForm)
        setEditing(false)
        sileo.success({ title: "Product updated" })
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Failed to save",
        })
      }
    })
  }

  function handleDelete() {
    setDeleting(false)
    startTransition(async () => {
      try {
        await deleteProduct(product.id)
      } catch (err) {
        sileo.error({
          title: err instanceof Error ? err.message : "Failed to delete",
        })
      }
    })
  }

  return (
    <>
      <button
        onClick={() => {
          setEditForm({ name: product.name, websiteUrl: product.websiteUrl })
          setEditing(true)
        }}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Edit product"
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        onClick={() => setDeleting(true)}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
        aria-label="Delete product"
      >
        <Trash2 className="size-3.5" />
      </button>

      {/* Edit */}
      <AlertDialog open={editing} onOpenChange={setEditing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit product</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
                className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">Website URL</label>
              <input
                value={editForm.websiteUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                placeholder="https://example.com"
                className="w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete */}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
