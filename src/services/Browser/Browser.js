/* eslint-disable no-undef */

// Chrome exposes the extension APIs on `chrome`, Firefox on `browser`.
const api =
  typeof browser !== 'undefined' && browser?.runtime
    ? browser
    : typeof chrome !== 'undefined' && chrome?.runtime
      ? chrome
      : null

export const runtime = api?.runtime ?? null

export const storage = api?.storage ?? null

// Answers the dApp request that opened this approval window, clears the
// pending request and closes the window. Exactly one of result/error.
export const sendPopupResponse = ({
  method,
  requestId,
  origin,
  result,
  error,
}) => {
  if (!runtime || !storage) return

  const cleanup = () => {
    storage.local.remove('pendingRequest', () => {
      window.close()
      // Fallback for contexts where window.close() is ignored (e.g. the
      // approval page opened as a tab in dev): go back to the wallet.
      setTimeout(() => {
        if (!window.closed) window.location.replace('/')
      }, 150)
    })
  }

  try {
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        ...(error ? { error } : { result }),
      },
      cleanup,
    )
  } catch {
    cleanup()
  }
}
