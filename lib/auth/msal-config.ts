import {
  EventType,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
  type SilentRequest,
} from "@azure/msal-browser"

const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? "2f2dcb5d-f3e1-4f33-8584-dcacd25d604d"
const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? "562c6df4-0ce8-4165-8969-f300f4c1842a"
const apiScope =
  process.env.NEXT_PUBLIC_AZURE_SCOPE ?? "api://562c6df4-0ce8-4165-8969-f300f4c1842a/api_access"
const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ?? "http://localhost:5173/auth"
const postLogoutRedirectUri = process.env.NEXT_PUBLIC_AZURE_POST_LOGOUT_REDIRECT_URI ?? "http://localhost:5173/login"

export const loginRequest = {
  scopes: [apiScope, "User.Read"],
}

const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)

function getPreferredAccount(accounts: AccountInfo[]): AccountInfo | null {
  return msalInstance.getActiveAccount() ?? accounts[0] ?? null
}

function setActiveAccountFromResult(result: AuthenticationResult | null) {
  if (result?.account) {
    msalInstance.setActiveAccount(result.account)
  }
}

msalInstance.addEventCallback((event) => {
  if (
    event.eventType === EventType.LOGIN_SUCCESS ||
    event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
  ) {
    const payload = event.payload as AuthenticationResult | null
    setActiveAccountFromResult(payload)
  }
})

export const msalInitializationPromise = msalInstance.initialize().then(() => {
  // handleRedirectPromise() is handled by MsalProvider — do not call it here
  // to avoid racing with MSAL React's internal redirect processing.

  // Restore active account from sessionStorage cache (for returning sessions)
  const account = getPreferredAccount(msalInstance.getAllAccounts())
  if (account) {
    msalInstance.setActiveAccount(account)
  }
})

export function getActiveAccount(): AccountInfo | null {
  return getPreferredAccount(msalInstance.getAllAccounts())
}

export async function acquireApiAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  await msalInitializationPromise

  const account = getActiveAccount()
  if (!account) {
    return null
  }

  const silentRequest: SilentRequest = {
    ...loginRequest,
    account,
  }

  try {
    const result = await msalInstance.acquireTokenSilent(silentRequest)
    return result.accessToken
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(loginRequest)
      return null
    }
    throw error
  }
}
