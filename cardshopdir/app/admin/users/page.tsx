import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { desc, asc, count, ilike, eq, or, and, isNull, ne } from "drizzle-orm"
import type { SearchParams } from "nuqs/server"
import { usersParamsCache } from "./search-params"
import { UserTable } from "./_components/user-table"

const PER_PAGE = 20

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page, q, role, status, sort } =
    await usersParamsCache.parse(searchParams)

  const conditions = []
  if (q) {
    conditions.push(
      or(
        ilike(user.name, `%${q}%`),
        ilike(user.email, `%${q}%`),
      ),
    )
  }
  if (role) {
    conditions.push(
      role === "admin" ? eq(user.role, "admin") : or(ne(user.role, "admin"), isNull(user.role)),
    )
  }
  if (status) {
    conditions.push(
      status === "banned" ? eq(user.banned, true) : or(eq(user.banned, false), isNull(user.banned)),
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const orderBy =
    sort === "oldest"
      ? asc(user.createdAt)
      : sort === "name"
        ? asc(user.name)
        : desc(user.createdAt)

  const [totalResult] = await db
    .select({ count: count() })
    .from(user)
    .where(where)
  const total = totalResult.count
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, totalPages)

  const items = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(orderBy)
    .limit(PER_PAGE)
    .offset((safePage - 1) * PER_PAGE)

  return (
    <UserTable
      users={items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role ?? "user",
        banned: u.banned ?? false,
        banReason: u.banReason,
        banExpires: u.banExpires?.toISOString() ?? null,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt.toISOString(),
      }))}
      total={total}
      page={safePage}
      totalPages={totalPages}
    />
  )
}
