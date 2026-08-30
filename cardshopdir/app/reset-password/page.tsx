"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { sileo } from "sileo"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="max-w-[320px] space-y-4 text-center">
          <h1 className="font-serif text-2xl tracking-tight">Invalid link</h1>
          <p className="text-[13px] text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-[12px] text-muted-foreground underline transition-colors hover:text-foreground"
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="max-w-[320px] space-y-4 text-center">
          <h1 className="font-serif text-2xl tracking-tight">Password updated</h1>
          <p className="text-[13px] text-muted-foreground">
            Your password has been reset. You can now sign in.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-full bg-foreground px-5 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirm) {
      sileo.error({ title: "Passwords don't match" })
      return
    }

    setLoading(true)

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    })

    if (error) {
      sileo.error({ title: error.message ?? "Link expired or invalid" })
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-[320px] space-y-6">
        <h1 className="text-center font-serif text-2xl tracking-tight">New password</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            aria-label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm password"
            aria-label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
