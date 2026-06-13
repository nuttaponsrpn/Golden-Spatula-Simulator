import type { AppError } from '~/types/app-error'

export const useGlobalError = () => {
  const error = useState<AppError | null>('global-error', () => null)

  const setGlobalError = (e: AppError) => {
    error.value = e
  }

  const clearGlobalError = () => {
    error.value = null
  }

  return { error, setGlobalError, clearGlobalError }
}
