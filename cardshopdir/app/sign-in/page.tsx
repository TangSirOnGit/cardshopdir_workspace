"use client"

import { useState, useRef } from "react"
import { signIn } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { sileo } from "sileo"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackURL = searchParams.get("callbackURL") ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(
    null
  )
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

      await signIn.email({
        email,
        password,
        fetchOptions: {
          headers: token ? { "x-captcha-response": token } : undefined,
          onSuccess: () => {
            window.location.href = callbackURL
          },
          onError: (ctx) => {
            sileo.error({
              title:
                ctx.error.code === "EMAIL_NOT_VERIFIED"
                  ? "Please verify your email first"
                  : "Invalid email or password",
            })
            setLoading(false)
            turnstileRef.current?.reset()
          },
        },
      })
    } catch {
      sileo.error({ title: "Verification failed, please try again" })
      setLoading(false)
      turnstileRef.current?.reset()
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-full max-w-[320px] space-y-6">
        <h1 className="text-center font-serif text-2xl tracking-tight">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
          />
          <input
            type="password"
            required
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-muted/50 px-4 py-3 text-[14px] transition-colors outline-none placeholder:text-muted-foreground focus:bg-muted"
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
              "Sign in"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[12px] text-muted-foreground/50">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-3">
          <button
            disabled={!!oauthLoading}
            onClick={() => {
              setOauthLoading("github")
              signIn.social({ provider: "github", callbackURL })
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-muted/50 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {oauthLoading === "github" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitHubIcon className="h-4 w-4" />
            )}
            GitHub
          </button>
          <button
            disabled={!!oauthLoading}
            onClick={() => {
              setOauthLoading("google")
              signIn.social({ provider: "google", callbackURL })
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-muted/50 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Google
          </button>
        </div>

        <div className="space-y-1.5 text-center text-[12px] text-muted-foreground">
          <p>
            <Link
              href="/forgot-password"
              className="underline transition-colors hover:text-foreground"
            >
              Forgot password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href={`/sign-up${callbackURL !== "/" ? `?callbackURL=${encodeURIComponent(callbackURL)}` : ""}`}
              className="underline transition-colors hover:text-foreground"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/40">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
