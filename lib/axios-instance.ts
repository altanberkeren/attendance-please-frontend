import axios from "axios"

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5176",
  headers: { "Content-Type": "application/json" },
})

export const customInstance = <T>(config: Parameters<typeof axiosInstance>[0]): Promise<T> => {
  return axiosInstance(config).then((res) => res.data)
}
