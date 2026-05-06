"use client"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"
import { useMemo } from "react"
import { loginRequest, msalInitializationPromise } from "@/lib/auth/msal-config"

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
  const isAuthenticated = useIsAuthenticated()

  const account = useMemo(() => instance.getActiveAccount() ?? accounts[0] ?? null, [accounts, instance])

  const user = useMemo<NormalizedUser | null>(() => {
    if (!account) return null

    const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>
    const rolesClaim = claims.roles
    const roles = Array.isArray(rolesClaim)
      ? rolesClaim.filter((role): role is string => typeof role === "string")
      : []

    const displayName = account.name ?? "User"
    const email = account.username ?? ""

    return {
      displayName,
      email,
      initials: getInitials(displayName),
      roles,
    }
  }, [account])

  const isLoading = inProgress !== InteractionStatus.None
  const isReady = !isLoading

  async function signIn() {
    await msalInitializationPromise
    await instance.loginRedirect(loginRequest)
  }

  function signOut() {
    // Local logout only — clear MSAL cache and active account
    // without ending the Microsoft session
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
