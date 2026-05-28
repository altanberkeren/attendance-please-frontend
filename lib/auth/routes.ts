import { hasAnyRole, type AppRole, type RoleBearingUser } from "@/lib/auth/roles"

type RouteAccessRule = {
  prefix: string
  roles: AppRole[]
}

const ROUTE_ACCESS: RouteAccessRule[] = [
  { prefix: "/courses", roles: ["Admin"] },
  { prefix: "/terms", roles: ["Admin"] },
  { prefix: "/course-offerings", roles: ["Admin", "Staff"] },
  { prefix: "/attendance", roles: ["Admin", "Staff"] },
  { prefix: "/my-courses", roles: ["Student", "Staff"] },
  { prefix: "/my-attendance", roles: ["Student"] },
]

export function canAccessDashboardRoute(pathname: string, user: RoleBearingUser): boolean {
  const rule = ROUTE_ACCESS
    .filter((candidate) => pathname === candidate.prefix || pathname.startsWith(`${candidate.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]

  if (!rule) return true
  return hasAnyRole(user, rule.roles)
}

export function getDefaultDashboardPath(_user: RoleBearingUser): string {
  return "/overview"
}
