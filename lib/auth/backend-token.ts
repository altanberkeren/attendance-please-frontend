import { clearAuthSession, getAccessToken, setAuthSession } from "@/lib/auth/session"
import type { AuthTokenResponse } from "@/lib/api/model"

export function getStoredBackendAccessToken(): string | null {
  return getAccessToken()
}

export function setBackendSessionForBrowser(session: AuthTokenResponse) {
  setAuthSession(session)
}

export function setBackendAccessTokenForSession(_token: string) {
  throw new Error("setBackendAccessTokenForSession is obsolete. Store the full auth session instead.")
}

export function clearBackendToken() {
  clearAuthSession()
}

export async function getBackendAccessToken(): Promise<string | null> {
  return getAccessToken()
}
