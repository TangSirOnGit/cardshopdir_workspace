"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LayoutDashboard,
  Users,
  Inbox,
  Package,
  Megaphone,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react"

const SECTIONS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/sponsors", label: "Sponsors", icon: Megaphone },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const current =
    SECTIONS.find((s) =>
      s.exact ? pathname === s.href : pathname.startsWith(s.href)
    ) ?? SECTIONS[0]

  return (
    <nav className="mb-6">
      {/* Mobile: shadcn Select with icons */}
      <div className="sm:hidden">
        <Select value={current.href} onValueChange={(v) => router.push(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <SelectItem key={s.href} value={s.href}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                    {s.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: pills */}
      <div className="hidden items-center gap-1 sm:flex">
        {SECTIONS.map((s) => {
          const active = s.exact
            ? pathname === s.href
            : pathname.startsWith(s.href)
          const Icon = s.icon

          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{s.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
