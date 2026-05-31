import type { AuthTokenResponse, AuthUserResponse } from "@/lib/api/model"

const SESSION_KEY = "attendance_auth_session"
const EXPIRY_SKEW_MS = 30_000

export type BackendAuthSession = AuthTokenResponse
export type BackendAuthUser = AuthUserResponse

function isBrowser() {
  return typeof window !== "undefined"
}

function isExpiredOrNearExpiry(value: string | undefined): boolean {
  if (!value) return true
  const expiresAt = new Date(value).getTime()
  if (Number.isNaN(expiresAt)) return true
  return expiresAt <= Date.now() + EXPIRY_SKEW_MS
}

function isSessionLike(value: unknown): value is BackendAuthSession {
  const candidate = value as Partial<BackendAuthSession> | null
  return !!candidate &&
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.accessTokenExpiresAt === "string" &&
    typeof candidate.refreshTokenExpiresAt === "string" &&
    !!candidate.user &&
    typeof candidate.user.email === "string" &&
    typeof candidate.user.name === "string" &&
    typeof candidate.user.role === "string" &&
    Array.isArray(candidate.user.roles)
}

export function getAuthSession(): BackendAuthSession | null {
  if (!isBrowser()) return null

  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isSessionLike(parsed)) return null

    if (isExpiredOrNearExpiry(parsed.refreshTokenExpiresAt)) {
      clearAuthSession()
      return null
    }

    return parsed
  } catch {
    clearAuthSession()
    return null
  }
}

export function setAuthSession(session: BackendAuthSession) {
  if (!isBrowser()) return
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  if (!isBrowser()) return
  window.localStorage.removeItem(SESSION_KEY)
}

export function getAuthUser(): BackendAuthUser | null {
  return getAuthSession()?.user ?? null
}

export function getAccessToken(): string | null {
  const session = getAuthSession()
  if (!session || isExpiredOrNearExpiry(session.accessTokenExpiresAt)) return null
  return session.accessToken
}

export function getRefreshToken(): string | null {
  const session = getAuthSession()
  if (!session || isExpiredOrNearExpiry(session.refreshTokenExpiresAt)) return null
  return session.refreshToken
}

export function hasUsableAuthSession(): boolean {
  return !!getAuthSession()
}
