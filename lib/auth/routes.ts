import {
  type AppRole,
  hasAnyRole,
  type RoleBearingUser,
} from "@/lib/auth/roles";

type RouteAccessRule = {
  prefix: string;
  roles: AppRole[];
};

const ROUTE_ACCESS: RouteAccessRule[] = [
  { prefix: "/courses", roles: ["Admin"] },
  { prefix: "/terms", roles: ["Admin"] },
  { prefix: "/users", roles: ["Admin"] },
  // Students can be assigned as course staff without changing their global role.
  // The backend still enforces per-offering access; these route rules only prevent
  // the dashboard shell from immediately redirecting legitimate student-staff.
  { prefix: "/course-offerings/detail", roles: ["Admin", "Staff", "Student"] },
  { prefix: "/course-offerings", roles: ["Admin", "Staff"] },
  { prefix: "/attendance", roles: ["Admin", "Staff", "Student"] },
  { prefix: "/my-courses", roles: ["Student"] },
  { prefix: "/staff-courses", roles: ["Staff", "Student"] },
  { prefix: "/my-attendance", roles: ["Student"] },
  { prefix: "/sessions/detail", roles: ["Admin", "Staff", "Student"] },
  { prefix: "/sessions", roles: ["Admin", "Staff"] },
];

export function canAccessDashboardRoute(
  pathname: string,
  user: RoleBearingUser,
): boolean {
  const rule = ROUTE_ACCESS.filter(
    (candidate) =>
      pathname === candidate.prefix ||
      pathname.startsWith(`${candidate.prefix}/`),
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!rule) return true;
  return hasAnyRole(user, rule.roles);
}

export function getDefaultDashboardPath(_user: RoleBearingUser): string {
  return "/overview";
}
