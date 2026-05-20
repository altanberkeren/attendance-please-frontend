import { acquireApiAccessToken } from "@/lib/auth/msal-config"

interface CachedToken {
  token: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null
const CACHE_DURATION_MS = 55 * 60 * 1000

export type BackendUserInfo = {
  userId: number
  email: string
  name: string
  role: string
}

let cachedUserInfo: BackendUserInfo | null = null

export async function getBackendToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const azureToken = await acquireApiAccessToken()
  if (!azureToken) return null

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5176"}/api/Auth/azure-login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${azureToken}`,
        },
      }
    )

    if (!response.ok) {
      cachedToken = null
      cachedUserInfo = null
      return null
    }

    const data = await response.json()
    cachedToken = {
      token: data.token as string,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    }
    cachedUserInfo = {
      userId: data.userId as number,
      email: data.email as string,
      name: data.name as string,
      role: data.role as string,
    }

    return cachedToken.token
  } catch {
    cachedToken = null
    cachedUserInfo = null
    return null
  }
}

export function getBackendUserInfo(): BackendUserInfo | null {
  return cachedUserInfo
}

export function clearBackendToken() {
  cachedToken = null
  cachedUserInfo = null
}