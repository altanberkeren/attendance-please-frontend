import type { UserRole } from "@/lib/api/model/userRole"

export type AppRole = UserRole

export type RoleBearingUser = {
  role?: string | null
  roles?: string[] | null
} | null | undefined

export const ROLE_PRIORITY: AppRole[] = ["Admin", "Staff", "Student"]

export function getUserRoles(user: RoleBearingUser): AppRole[] {
  const rawRoles = [
    ...(user?.roles ?? []),
    ...(user?.role ? [user.role] : []),
  ]

  return Array.from(
    new Set(
      rawRoles.filter((role): role is AppRole =>
        role === "Admin" || role === "Staff" || role === "Student",
      ),
    ),
  )
}

export function hasRole(user: RoleBearingUser, role: AppRole): boolean {
  return getUserRoles(user).includes(role)
}

export function hasAnyRole(user: RoleBearingUser, roles: AppRole[]): boolean {
  if (roles.length === 0) return true
  const userRoles = getUserRoles(user)
  return roles.some((role) => userRoles.includes(role))
}

export function isAdmin(user: RoleBearingUser): boolean {
  return hasRole(user, "Admin")
}

export function isStaff(user: RoleBearingUser): boolean {
  return hasRole(user, "Staff")
}

export function isStudent(user: RoleBearingUser): boolean {
  return hasRole(user, "Student")
}

export function getPrimaryRole(user: RoleBearingUser): AppRole | null {
  const roles = getUserRoles(user)
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null
}
