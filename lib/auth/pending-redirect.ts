const PENDING_AUTH_REDIRECT_KEY = "attendance_pending_auth_redirect"

function isBrowser() {
  return typeof window !== "undefined"
}

function isSafeInternalPath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("://")
}

export function setPendingAuthRedirect(path: string | null | undefined) {
  if (!isBrowser() || !path || !isSafeInternalPath(path)) return
  window.sessionStorage.setItem(PENDING_AUTH_REDIRECT_KEY, path)
}

export function consumePendingAuthRedirect(): string | null {
  if (!isBrowser()) return null

  const value = window.sessionStorage.getItem(PENDING_AUTH_REDIRECT_KEY)
  window.sessionStorage.removeItem(PENDING_AUTH_REDIRECT_KEY)

  if (!value || !isSafeInternalPath(value)) return null
  return value
}
