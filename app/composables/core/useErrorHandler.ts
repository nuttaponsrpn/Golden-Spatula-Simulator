import type { AppError } from "~/types/app-error"

export const useErrorHandler = () => {
  const { setGlobalError } = useGlobalError()

  const showError = (error: AppError) => {
    if (error.recoverable) {
      setGlobalError(error)
    } else {
      setGlobalError(error)
      navigateTo(`/error?code=${error.code}`)
    }
  }

  return { showError }
}
