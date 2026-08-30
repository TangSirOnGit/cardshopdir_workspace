import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Plausible proxy: strip cookies + preserve real client IP ───────────
  if (pathname === "/proxy/api/event") {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete("cookie")

    const existingXff = requestHeaders.get("x-forwarded-for")
    const firstForwardedIp = existingXff?.split(",")[0]?.trim()
    const clientIp =
      requestHeaders.get("cf-connecting-ip") ||
      requestHeaders.get("true-client-ip") ||
      firstForwardedIp ||
      requestHeaders.get("x-real-ip")

    if (clientIp) {
      requestHeaders.set("x-forwarded-for", clientIp)
      requestHeaders.set("x-real-ip", clientIp)
      requestHeaders.set("x-plausible-ip", clientIp)
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // ── Auth guard: redirect unauthenticated users ────────────────────────
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")

  if (!hasSession) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("callbackURL", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/proxy/api/event", "/submit", "/profile", "/admin/:path*"],
}
