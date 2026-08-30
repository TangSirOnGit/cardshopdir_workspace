"use client"

import { useActionState } from "react"
import { sileo } from "sileo"
import { subscribe } from "@/lib/actions/subscribe"
import { useEffect, useRef } from "react"

export function Subscribe() {
  const [state, action, isPending] = useActionState(subscribe, { ok: false })
  const prevOk = useRef(false)

  useEffect(() => {
    if (state.ok && !prevOk.current) {
      sileo.success({ title: "You're in!" })
    } else if (state.error) {
      sileo.error({ title: state.error })
    }
    prevOk.current = state.ok
  }, [state])

  if (state.ok) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <p className="text-[13px] text-muted-foreground">
          You&apos;re in. We&apos;ll notify you.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="subscribe-email" className="sr-only">
        Email address
      </label>
      <input
        id="subscribe-email"
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] outline-none transition-all placeholder:text-muted-foreground/60 focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full shrink-0 rounded-lg bg-foreground px-3 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
      >
        Notify me
      </button>
    </form>
  )
}
