import axios from "axios"
import type { AxiosError, AxiosRequestConfig } from "axios"
import type { AuthTokenResponse } from "@/lib/api/model"
import { getAccessToken, getRefreshToken, setAuthSession, clearAuthSession } from "@/lib/auth/session"

export type CustomAxiosRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
  _retry?: boolean
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5176",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

let interceptorConfigured = false
let refreshPromise: Promise<AuthTokenResponse> | null = null

function withAuthorizationHeader(config: AxiosRequestConfig, token: string) {
  const value = `Bearer ${token}`

  if (config.headers && typeof (config.headers as { set?: (k: string, v: string) => void }).set === "function") {
    ;(config.headers as { set: (k: string, v: string) => void }).set("Authorization", value)
    return
  }

  config.headers = {
    ...(config.headers ?? {}),
    Authorization: value,
  }
}

async function refreshBackendSession(): Promise<AuthTokenResponse> {
  if (refreshPromise) return refreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error("No refresh token available.")
  }

  refreshPromise = axiosInstance.request<AuthTokenResponse>({
    url: "/api/Auth/refresh",
    method: "POST",
    data: { refreshToken },
    skipAuth: true,
    skipRefresh: true,
  } as CustomAxiosRequestConfig).then((response) => {
    setAuthSession(response.data)
    return response.data
  }).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function redirectToLogin() {
  if (typeof window === "undefined") return
  if (window.location.pathname !== "/login") {
    window.location.assign("/login")
  }
}

function configureInterceptor() {
  if (interceptorConfigured) return

  axiosInstance.interceptors.request.use(async (config) => {
    const customConfig = config as CustomAxiosRequestConfig
    if (customConfig.skipAuth) return config

    const token = getAccessToken()
    if (token) {
      withAuthorizationHeader(config, token)
    }

    return config
  })

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as CustomAxiosRequestConfig | undefined

      if (
        error.response?.status !== 401 ||
        !originalConfig ||
        originalConfig._retry ||
        originalConfig.skipRefresh
      ) {
        return Promise.reject(error)
      }

      originalConfig._retry = true

      try {
        const session = await refreshBackendSession()
        withAuthorizationHeader(originalConfig, session.accessToken)
        return axiosInstance(originalConfig)
      } catch (refreshError) {
        clearAuthSession()
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    },
  )

  interceptorConfigured = true
}

export const customInstance = <T>(config: CustomAxiosRequestConfig): Promise<T> => {
  configureInterceptor()
  return axiosInstance(config).then((res) => res.data)
}
