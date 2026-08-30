"use client"

import { useActionState } from "react"
import { subscribe } from "@/lib/actions/subscribe"

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribe, {
    ok: false,
  })

  if (state.ok) {
    return (
      <div
        role="status"
        className="rounded-xl bg-emerald-500/10 px-6 py-5 text-center text-[14px] text-emerald-700 dark:text-emerald-400"
      >
        You&rsquo;re subscribed! Check your inbox for a welcome email.
      </div>
    )
  }

  return (
    <form action={action} className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        aria-label="Email address"
        className="h-10 flex-1 rounded-lg border border-border bg-background px-3.5 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Subscribing..." : "Subscribe"}
      </button>
      {state.error && (
        <p role="alert" className="text-[12px] text-red-600">
          {state.error}
        </p>
      )}
    </form>
  )
}
