import { acquireApiAccessToken, getActiveAccount } from "@/lib/auth/msal-config"
import { extractUniversityEmailFromClaims } from "@/lib/auth/university-account"

type AzureExchangeResponse = {
  token: string
  userId: number
  email: string
  name: string
  role: string
}

const STORAGE_KEY = "attendance_backend_access_token"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5176"

let inFlightTokenRequest: Promise<string | null> | null = null

function parseJwtExpiration(token: string): number | null {
  try {
    const payloadBase64 = token.split(".")[1]
    if (!payloadBase64) return null
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))
    const payload = JSON.parse(payloadJson) as { exp?: number }
    return typeof payload.exp === "number" ? payload.exp : null
  } catch {
    return null
  }
}

function isExpiredOrNearExpiry(token: string): boolean {
  const exp = parseJwtExpiration(token)
  if (!exp) return true
  const nowSeconds = Math.floor(Date.now() / 1000)
  return exp <= nowSeconds + 30
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null
  const token = window.sessionStorage.getItem(STORAGE_KEY)
  if (!token) return null
  if (isExpiredOrNearExpiry(token)) {
    window.sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
  return token
}

function storeToken(token: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(STORAGE_KEY, token)
}

export function setBackendAccessTokenForSession(token: string) {
  storeToken(token)
}

export function clearBackendToken() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(STORAGE_KEY)
}

async function exchangeAzureIdentityForBackendToken(
  name: string,
  email: string,
  azureAccessToken: string | null,
): Promise<string> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (azureAccessToken) {
    headers.Authorization = `Bearer ${azureAccessToken}`
  }

  const response = await fetch(`${API_BASE_URL}/api/Auth/azure-exchange`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, email }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Azure exchange failed (${response.status}): ${text || "unknown error"}`)
  }

  const body = (await response.json()) as AzureExchangeResponse
  if (!body.token) {
    throw new Error("Azure exchange succeeded but no backend token was returned.")
  }

  return body.token
}

export async function getBackendAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null

  const currentToken = readStoredToken()
  if (currentToken) return currentToken

  if (inFlightTokenRequest) {
    return inFlightTokenRequest
  }

  inFlightTokenRequest = (async () => {
    const account = getActiveAccount()
    if (!account) return null
    const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>
    const normalizedEmail = extractUniversityEmailFromClaims(claims, account.username ?? "")
    if (!normalizedEmail) return null

    let azureAccessToken: string | null = null
    try {
      azureAccessToken = await acquireApiAccessToken()
    } catch (error) {
      // Keep sign-in usable even when extra API scopes are not consented.
      console.warn("Could not acquire Azure access token for exchange.", error)
    }

    const backendToken = await exchangeAzureIdentityForBackendToken(
      account.name ?? normalizedEmail,
      normalizedEmail,
      azureAccessToken,
    )

    storeToken(backendToken)
    return backendToken
  })()

  try {
    return await inFlightTokenRequest
  } finally {
    inFlightTokenRequest = null
  }
}
