"use client"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"
import { useEffect, useMemo, useState } from "react"
import { clearBackendToken } from "@/lib/auth/backend-token"
import { clearLocalSessionUser, getLocalSessionUser, type LocalSessionUser } from "@/lib/auth/local-session"
import { getSignInRedirectUri, loginRequest, msalInitializationPromise, type SignInRedirectTarget } from "@/lib/auth/msal-config"
import { extractUniversityEmailFromClaims } from "@/lib/auth/university-account"

type NormalizedUser = {
  displayName: string
  email: string
  initials: string
  roles: string[]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U"
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal()
  const isMsalAuthenticated = useIsAuthenticated()
  const [localSessionUser, setLocalSessionUser] = useState<LocalSessionUser | null>(null)
  const [localSessionLoaded, setLocalSessionLoaded] = useState(false)

  const account = useMemo(() => instance.getActiveAccount() ?? accounts[0] ?? null, [accounts, instance])

  useEffect(() => {
    setLocalSessionUser(getLocalSessionUser())
    setLocalSessionLoaded(true)
  }, [])

  const isAuthenticated = isMsalAuthenticated || !!localSessionUser

  const user = useMemo<NormalizedUser | null>(() => {
    if (localSessionUser) {
      return {
        displayName: localSessionUser.displayName,
        email: localSessionUser.email,
        initials: getInitials(localSessionUser.displayName),
        roles: localSessionUser.roles,
      }
    }

    if (!account) return null

    const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>
    const rolesClaim = claims.roles
    const roles = Array.isArray(rolesClaim)
      ? rolesClaim.filter((role): role is string => typeof role === "string")
      : []

    const displayName = account.name ?? "User"
    const email = extractUniversityEmailFromClaims(claims, account.username ?? "")

    return {
      displayName,
      email,
      initials: getInitials(displayName),
      roles,
    }
  }, [account, localSessionUser])

  const isLoading = inProgress !== InteractionStatus.None
  const isReady = !isLoading && localSessionLoaded

  async function signIn(target: SignInRedirectTarget = "root") {
    await msalInitializationPromise
    clearLocalSessionUser()
    setLocalSessionUser(null)
    clearBackendToken()
    instance.setActiveAccount(null)
    await instance.loginRedirect({
      ...loginRequest,
      redirectUri: getSignInRedirectUri(target),
    })
  }

  function signOut() {
    // Local logout only: clear caches without ending the Microsoft session
    clearBackendToken()
    clearLocalSessionUser()
    setLocalSessionUser(null)
    instance.clearCache()
    instance.setActiveAccount(null)
  }

  return {
    account,
    user,
    isAuthenticated,
    isLoading,
    isReady,
    signIn,
    signOut,
  }
}
