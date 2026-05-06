"use client"

import { useEffect, useRef, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { InteractionRequiredAuthError } from "@azure/msal-browser"
import { msalInitializationPromise } from "@/lib/auth/msal-config"

const GRAPH_PHOTO_URL = "https://graph.microsoft.com/v1.0/me/photo/$value"
const GRAPH_SCOPES = ["User.Read"]

export function useProfilePhoto() {
  const { instance, accounts } = useMsal()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPhoto() {
      await msalInitializationPromise

      const account = instance.getActiveAccount() ?? accounts[0] ?? null
      if (!account) {
        setIsLoading(false)
        return
      }

      try {
        const result = await instance.acquireTokenSilent({
          scopes: GRAPH_SCOPES,
          account,
        })

        const response = await fetch(GRAPH_PHOTO_URL, {
          headers: {
            Authorization: `Bearer ${result.accessToken}`,
          },
        })

        if (!response.ok) {
          // User likely has no profile photo
          setIsLoading(false)
          return
        }

        const blob = await response.blob()

        if (cancelled) return

        // Clean up previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
        }

        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setPhotoUrl(url)
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // Can't silently acquire — skip photo for now
          return
        }
        // Silently ignore — fallback to initials
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchPhoto()

    return () => {
      cancelled = true
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [instance, accounts])

  return { photoUrl, isLoading }
}
