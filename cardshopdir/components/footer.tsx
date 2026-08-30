import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher/theme-switcher"

const LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
]

export function Footer({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 lg:px-12">
      <div className="space-y-6 border-t border-border/50 py-8 sm:py-10">
        {/* Nav + theme control */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeSwitcher />
        </div>

        {/* Divider */}
        <div
          aria-hidden="true"
          className="border-t border-dashed border-border/40"
        />

        {/* Copyright + attribution */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-muted-foreground">
            &copy; {year} {siteName}
          </p>
          <a
            href="https://cardshopdir.com"
            target="_blank"
            rel="noopener"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            CardShopDir
          </a>
        </div>
      </div>
    </footer>
  )
}
