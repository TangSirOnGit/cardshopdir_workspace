"use client"

import { signOut } from "@/lib/auth-client"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          fetchOptions: { onSuccess: () => { window.location.href = "/" } },
        })
      }
      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-5 py-2 text-[13px] font-medium transition-colors hover:bg-muted-foreground/10"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  )
}
