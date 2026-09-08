/* eslint-disable no-undef */

// Chrome exposes the extension APIs on `chrome`, Firefox on `browser`.
const api =
  typeof browser !== 'undefined' && browser?.runtime
    ? browser
    : typeof chrome !== 'undefined' && chrome?.runtime
      ? chrome
      : null

export const runtime = api?.runtime ?? null

export const windows = api?.windows ?? null

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

  // The background clears the per-window pendingRequest entry when it
  // processes this response (keyed by THIS window's id, passed along so a
  // response can only ever clear its own request).
  const cleanup = () => {
    window.close()
    // Fallback for contexts where window.close() is ignored (e.g. the
    // approval page opened as a tab in dev): go back to the wallet.
    setTimeout(() => {
      if (!window.closed) window.location.replace('/')
    }, 150)
  }

  const send = (windowId) => {
    try {
      runtime.sendMessage(
        {
          action: 'popupResponse',
          method,
          requestId,
          origin,
          windowId,
          ...(error ? { error } : { result }),
        },
        cleanup,
      )
    } catch {
      cleanup()
    }
  }

  if (windows?.getCurrent) {
    windows.getCurrent((win) => send(win?.id ?? null))
  } else {
    send(null)
  }
}
