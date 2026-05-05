"use client"

import { MsalProvider } from "@azure/msal-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { msalInitializationPromise, msalInstance, acquireApiAccessToken } from "@/lib/auth/msal-config"
import { setAccessTokenProvider } from "@/lib/auth/token-provider"
import { ThemeProvider } from "@/hooks/use-theme"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let mounted = true

    setAccessTokenProvider(async () => acquireApiAccessToken())

    msalInitializationPromise.finally(() => {
      if (mounted) setAuthReady(true)
    })

    return () => {
      mounted = false
      setAccessTokenProvider(null)
    }
  }, [])

  if (!authReady) {
    return null
  }

  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MsalProvider>
  )
}
