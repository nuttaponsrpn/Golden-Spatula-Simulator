export type AppErrorKind =
  | 'network'
  | 'api'
  | 'validation'
  | 'unexpected'

export interface AppError {
  kind: AppErrorKind
  code: string
  userMessage: string
  recoverable: boolean
  cause?: unknown
}
