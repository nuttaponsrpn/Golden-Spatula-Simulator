import { ApiException } from "~/types/api-error"
import { normalizeError } from "~/utils/error"

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  const request = async <T>(
    path: string,
    options: any = {}
  ): Promise<{ status: "success"; data: T } | { status: "error"; error: any }> => {
    try {
      const data = (await $fetch<T>(path, {
        baseURL,
        ...options,
        async onResponseError({ response }) {
          throw new ApiException(response.status, response._data)
        },
      })) as T
      return { status: "success", data }
    } catch (e) {
      return { status: "error", error: normalizeError(e) }
    }
  }

  return {
    get: <T>(path: string, options?: any) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: any, options?: any) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T>(path: string, body?: any, options?: any) =>
      request<T>(path, { ...options, method: "PUT", body }),
    delete: <T>(path: string, options?: any) =>
      request<T>(path, { ...options, method: "DELETE" }),
    patch: <T>(path: string, body?: any, options?: any) =>
      request<T>(path, { ...options, method: "PATCH", body }),
  }
}
