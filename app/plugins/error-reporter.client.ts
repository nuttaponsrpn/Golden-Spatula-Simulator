export default defineNuxtPlugin(() => {
  const { setGlobalError } = useGlobalError()

  window.addEventListener('unhandledrejection', (event) => {
    const error = normalizeError(event.reason)
    setGlobalError(error)
    if (import.meta.dev) {
      console.error('[unhandledrejection]', event.reason)
    }
  })

  window.onerror = (_message, _source, _line, _col, err) => {
    const error = normalizeError(err ?? new Error('Unknown window error'))
    setGlobalError(error)
    if (import.meta.dev) {
      console.error('[onerror]', err)
    }
    return true
  }
})
