"use client"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clearBackendToken } from "@/lib/auth/backend-token"
import { exchangeEntraTokenForBackendSession } from "@/lib/auth/auth-service"
import { getAuthSession, type BackendAuthSession } from "@/lib/auth/session"
import { loginRequest, msalInitializationPromise } from "@/lib/auth/msal-config"
import { setPendingAuthRedirect } from "@/lib/auth/pending-redirect"

type NormalizedUser = {
  id: number | string
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
  const [session, setSession] = useState<BackendAuthSession | null>(() => getAuthSession())
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [isExchanging, setIsExchanging] = useState(false)
  const exchangeInFlightRef = useRef(false)
  const mountedRef = useRef(false)

  const account = useMemo(() => instance.getActiveAccount() ?? accounts[0] ?? null, [accounts, instance])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const reloadSession = useCallback(() => {
    setSession(getAuthSession())
  }, [])

  useEffect(() => {
    reloadSession()
  }, [reloadSession])

  useEffect(() => {
    if (inProgress !== InteractionStatus.None || !isMsalAuthenticated || !account || session || exchangeInFlightRef.current || exchangeError) {
      return
    }

    exchangeInFlightRef.current = true
    setIsExchanging(true)
    setExchangeError(null)

    exchangeEntraTokenForBackendSession()
      .then((nextSession) => {
        if (mountedRef.current) setSession(nextSession)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not complete backend sign-in."
        if (mountedRef.current) setExchangeError(message)
      })
      .finally(() => {
        exchangeInFlightRef.current = false
        if (mountedRef.current) setIsExchanging(false)
      })
  }, [account, exchangeError, inProgress, isMsalAuthenticated, session])

  const user = useMemo<NormalizedUser | null>(() => {
    if (!session?.user) return null

    return {
      id: session.user.id,
      displayName: session.user.name,
      email: session.user.email,
      initials: getInitials(session.user.name),
      roles: session.user.roles,
    }
  }, [session])

  const isMsalBusy = inProgress !== InteractionStatus.None
  const isMsalReady = !isMsalBusy
  const isLoading = isMsalBusy || isExchanging
  const isReady = !isMsalBusy && !isExchanging
  const isAuthenticated = !!session

  async function signIn(returnTo?: string) {
    await msalInitializationPromise
    setPendingAuthRedirect(returnTo)
    clearBackendToken()
    setSession(null)
    setExchangeError(null)
    instance.setActiveAccount(null)
    await instance.loginRedirect(loginRequest)
  }

  async function signOut() {
    clearBackendToken()
    setSession(null)
    setExchangeError(null)
    await instance.clearCache()
    instance.setActiveAccount(null)
  }

  return {
    account,
    user,
    isAuthenticated,
    isLoading,
    isReady,
    isMsalReady,
    isExchanging,
    exchangeError,
    reloadSession,
    signIn,
    signOut,
  }
}
