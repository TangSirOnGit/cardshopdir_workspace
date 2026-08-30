"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/admin"

// ── Ban user ──────────────────────────────────────────────────────

export async function banUser(
  userId: string,
  banReason?: string,
  banExpiresIn?: number,
): Promise<{ ok: boolean }> {
  await requireAdmin()

  await auth.api.banUser({
    body: {
      userId,
      banReason: banReason || "Banned by admin",
      ...(banExpiresIn ? { banExpiresIn } : {}),
    },
    headers: await headers(),
  })

  revalidatePath("/admin/users")

  return { ok: true }
}

// ── Unban user ────────────────────────────────────────────────────

export async function unbanUser(userId: string): Promise<{ ok: boolean }> {
  await requireAdmin()

  await auth.api.unbanUser({
    body: { userId },
    headers: await headers(),
  })

  revalidatePath("/admin/users")

  return { ok: true }
}

// ── Delete user ───────────────────────────────────────────────────

export async function deleteUser(userId: string): Promise<{ ok: boolean }> {
  const session = await requireAdmin()

  // Prevent self-deletion
  if (session.user.id === userId) {
    throw new Error("Cannot delete your own account")
  }

  await auth.api.removeUser({
    body: { userId },
    headers: await headers(),
  })

  revalidatePath("/admin/users")

  return { ok: true }
}

// ── Set role ──────────────────────────────────────────────────────

export async function setUserRole(
  userId: string,
  role: "admin" | "user",
): Promise<{ ok: boolean }> {
  const session = await requireAdmin()

  // Prevent demoting yourself
  if (session.user.id === userId && role !== "admin") {
    throw new Error("Cannot remove your own admin role")
  }

  await auth.api.setRole({
    body: { userId, role },
    headers: await headers(),
  })

  revalidatePath("/admin/users")

  return { ok: true }
}

// ── Revoke all sessions ───────────────────────────────────────────

export async function revokeUserSessions(
  userId: string,
): Promise<{ ok: boolean }> {
  await requireAdmin()

  await auth.api.revokeUserSessions({
    body: { userId },
    headers: await headers(),
  })

  revalidatePath("/admin/users")

  return { ok: true }
}

// Note: impersonation is handled client-side via authClient.admin.impersonateUser()
// because it needs to set session cookies in the browser directly.
