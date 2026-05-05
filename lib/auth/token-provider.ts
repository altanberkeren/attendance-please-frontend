export type AccessTokenProvider = () => Promise<string | null>

let accessTokenProvider: AccessTokenProvider | null = null

export function setAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider
}

export function getAccessTokenProvider(): AccessTokenProvider | null {
  return accessTokenProvider
}
