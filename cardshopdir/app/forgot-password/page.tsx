"use client"

import { useState, useRef } from "react"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { sileo } from "sileo"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const turnstileRef = useRef<TurnstileInstance | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const turnstileEnabled = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      const token = turnstileEnabled
        ? await turnstileRef.current?.getResponsePromise(30000, 100)
        : undefined

      if (turnstileEnabled && !token) {
        sileo.error({ title: "Verification failed, please try again" })
        setLoading(false)
        return
      }

      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
        fetchOptions: {
          headers: token ? { "x-captcha-response": token } : undefined,
        },
      })

      setSent(true)
    } catch {
      sileo.error({ title: "Verification failed, please try again" })
      setLoading(false)
      turnstileRef.current?.reset()
    }
  }

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="max-w-[320px] space-y-4 text-center">
          <h1 className="font-serif text-2xl tracking-tight">Check your email</h1>
          <p className="text-[13px] text-muted-foreground">
            If an account exists for <strong>{email}</strong>, we sent a
            password reset link.
          </p>
          <Link
            href="/sign-in"
            className="inline-block text-[12px] text-muted-foreground underline transition-colors hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-[320px] space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl tracking-tight">Forgot password</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted"
          />

          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              options={{ size: "invisible" }}
              onError={() => turnstileRef.current?.reset()}
            />
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        <p className="text-center text-[12px] text-muted-foreground">
          <Link
            href="/sign-in"
            className="underline transition-colors hover:text-foreground"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
