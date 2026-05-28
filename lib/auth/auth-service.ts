import type { AuthTokenResponse } from "@/lib/api/model"
import { customInstance } from "@/lib/axios-instance"
import { setAuthSession } from "@/lib/auth/session"
import { acquireApiAccessToken } from "@/lib/auth/msal-config"

export async function exchangeEntraTokenForBackendSession(): Promise<AuthTokenResponse> {
  const entraToken = await acquireApiAccessToken()
  if (!entraToken) {
    throw new Error("Could not acquire Microsoft Entra token. Sign out and sign in again, then approve the API access permission if asked.")
  }

  const session = await customInstance<AuthTokenResponse>({
    url: "/api/Auth/exchange",
    method: "POST",
    headers: {
      Authorization: `Bearer ${entraToken}`,
    },
    skipAuth: true,
    skipRefresh: true,
  })

  setAuthSession(session)
  return session
}
