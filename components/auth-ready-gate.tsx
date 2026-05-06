"use client"

import { InteractionStatus } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"

export function AuthReadyGate({ children }: { children: React.ReactNode }) {
  const { inProgress } = useMsal()

  if (inProgress !== InteractionStatus.None) {
    return null
  }

  return <>{children}</>
}
