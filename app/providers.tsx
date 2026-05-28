"use client"

import { MsalProvider } from "@azure/msal-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { msalInitializationPromise, msalInstance } from "@/lib/auth/msal-config"
import { ThemeProvider } from "@/hooks/use-theme"
import { AuthReadyGate } from "@/components/auth-ready-gate"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [msalInitDone, setMsalInitDone] = useState(false)

  useEffect(() => {
    let mounted = true

    msalInitializationPromise.finally(() => {
      if (mounted) setMsalInitDone(true)
    })

    return () => {
      mounted = false
    }
  }, [])

  if (!msalInitDone) {
    return null
  }

  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthReadyGate>{children}</AuthReadyGate>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MsalProvider>
  )
}
