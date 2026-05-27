import { getUniversityAccountType } from "@/lib/auth/university-account"

export type LocalSessionUser = {
  displayName: string
  email: string
  roles: string[]
}

const LOCAL_SESSION_USER_KEY = "attendance_local_session_user"

export function getLocalSessionUser(): LocalSessionUser | null {
  if (typeof window === "undefined") return null

  const raw = window.sessionStorage.getItem(LOCAL_SESSION_USER_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<LocalSessionUser>
    if (!parsed || typeof parsed.displayName !== "string" || typeof parsed.email !== "string" || !Array.isArray(parsed.roles)) {
      return null
    }

    const roles = parsed.roles.filter((role): role is string => typeof role === "string")
    return {
      displayName: parsed.displayName,
      email: parsed.email,
      roles,
    }
  } catch {
    return null
  }
}

export function setLocalSessionUser(user: LocalSessionUser) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(LOCAL_SESSION_USER_KEY, JSON.stringify(user))
}

export function clearLocalSessionUser() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(LOCAL_SESSION_USER_KEY)
}

export function inferRolesFromEmail(email: string): string[] {
  const type = getUniversityAccountType(email)

  if (type === "staff") {
    return ["Staff"]
  }

  if (type === "student") {
    return ["Student"]
  }

  return ["Student"]
}

