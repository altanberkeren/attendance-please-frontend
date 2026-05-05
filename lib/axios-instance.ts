import axios from "axios"
import type { AxiosRequestConfig } from "axios"
import { getAccessTokenProvider } from "@/lib/auth/token-provider"

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5176",
  headers: { "Content-Type": "application/json" },
})

let interceptorConfigured = false

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

function configureInterceptor() {
  if (interceptorConfigured) return

  axiosInstance.interceptors.request.use(async (config) => {
    const provider = getAccessTokenProvider()
    if (!provider) return config

    const token = await provider()
    if (!token) return config

    withAuthorizationHeader(config, token)
    return config
  })

  interceptorConfigured = true
}

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  configureInterceptor()
  return axiosInstance(config).then((res) => res.data)
}
