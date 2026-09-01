"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { useSession } from "@/lib/auth-client"

interface HeaderProps {
  siteName: string
}

const staticNavLinks = [
  { href: "/directory", label: "Directory" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
]

export function Header({ siteName }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const { data: session, isPending } = useSession()
  const user = session?.user
    ? {
        name: session.user.name,
        image: session.user.image ?? null,
        role: (session.user as { role?: string | null }).role ?? null,
      }
    : null

  const navLinks =
    user?.role === "admin"
      ? [...staticNavLinks, { href: "/admin", label: "Admin" }]
      : staticNavLinks

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header>
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-xl font-semibold"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            {siteName}
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <DesktopUserSlot user={user} isPending={isPending} />
          </nav>

          <div className="flex items-center gap-3 sm:hidden">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className="border-t border-border pt-3 pb-4 sm:hidden"
          >
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-1 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <MobileUserSlot
                user={user}
                isPending={isPending}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

// ── User slots ────────────────────────────────────────────────────

type SlotUser = { name: string; image: string | null; role: string | null }

function DesktopUserSlot({
  user,
  isPending,
}: {
  user: SlotUser | null
  isPending: boolean
}) {
  if (isPending) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-6 w-6 shrink-0 rounded-full bg-muted"
      />
    )
  }
  if (!user) {
    return null
  }
  return (
    <Link href="/profile" aria-label="Profile">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name}
          width={24}
          height={24}
          className="rounded-full transition-opacity hover:opacity-70"
        />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-medium transition-opacity hover:opacity-70">
          {user.name?.charAt(0).toUpperCase()}
        </span>
      )}
    </Link>
  )
}

function MobileUserSlot({
  user,
  isPending,
  onNavigate,
}: {
  user: SlotUser | null
  isPending: boolean
  onNavigate: () => void
}) {
  if (isPending) {
    return (
      <span
        aria-hidden="true"
        className="block h-[42px] w-full rounded-md bg-muted/40"
      />
    )
  }
  if (!user) {
    return null
  }
  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-md px-1 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name}
          width={22}
          height={22}
          className="rounded-full"
        />
      ) : (
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-muted text-[10px] font-medium">
          {user.name?.charAt(0).toUpperCase()}
        </span>
      )}
      Profile
    </Link>
  )
}
