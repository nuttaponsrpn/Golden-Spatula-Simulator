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
    // err is null for cross-origin script errors — browser withholds details by design; nothing actionable
    if (!err) return true
    const error = normalizeError(err)
    setGlobalError(error)
    if (import.meta.dev) {
      console.error('[onerror]', err)
    }
    return true
  }
})
