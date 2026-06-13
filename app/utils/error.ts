import type { AppError } from '~/types/app-error'
import { ApiException } from '~/types/api-error'

export const isApiError = (e: unknown): e is ApiException =>
  e instanceof ApiException

export const normalizeError = (e: unknown): AppError => {
  if (isApiError(e)) {
    const recoverable = e.status >= 500 || e.status === 408 || e.status === 429
    return {
      kind: 'api',
      code: e.payload.code,
      userMessage: 'เกิดข้อผิดพลาดจากระบบ กรุณาลองใหม่อีกครั้ง',
      recoverable,
      cause: e,
    }
  }

  if (e instanceof TypeError && e.message.toLowerCase().includes('fetch')) {
    return networkError()
  }

  if (e instanceof Error) {
    return {
      kind: 'unexpected',
      code: 'UNEXPECTED_ERROR',
      userMessage: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
      recoverable: true,
      cause: e,
    }
  }

  return {
    kind: 'unexpected',
    code: 'UNKNOWN_ERROR',
    userMessage: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
    recoverable: true,
    cause: e,
  }
}

export const networkError = (): AppError => ({
  kind: 'network',
  code: 'NETWORK_UNAVAILABLE',
  userMessage: 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  recoverable: true,
})

export const validationError = (code: string, userMessage: string): AppError => ({
  kind: 'validation',
  code,
  userMessage,
  recoverable: true,
})
