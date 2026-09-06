/* eslint-disable no-undef */
;(function () {
  const api = typeof browser !== 'undefined' ? browser : chrome

  const cloneForPage = (value) =>
    typeof cloneInto !== 'undefined' ? cloneInto(value, window) : value

  const postToPage = (message) => {
    window.postMessage(cloneForPage(message), '*')
  }

  // Inject mojito.js into the page
  try {
    const script = document.createElement('script')
    script.src = api.runtime.getURL('mojito.js')
    script.onload = () => script.remove()
    ;(document.head || document.documentElement).appendChild(script)
  } catch (error) {
    console.error('[Mojito] Failed to inject SDK:', error)
  }

  const origin = window.location.origin
  const pendingRequests = new Map() // requestId -> timeout id
  const RESPONSE_TIMEOUT_MS = 5 * 60 * 1000 // approvals can take a while

  // Tell pages with an existing session as soon as the content script loads.
  api.runtime.sendMessage({ method: 'getSession', origin }, (response) => {
    if (api.runtime.lastError || !response?.result) return

    postToPage({
      type: 'MINTLAYER_EVENT',
      event: 'accountsChanged',
      data: response.result.address,
    })
  })

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== 'MINTLAYER_REQUEST') {
      return
    }

    const requestId = event.data.requestId

    // Guard against duplicate requests and answer stale ids at once.
    if (pendingRequests.has(requestId)) return

    const timeoutId = setTimeout(() => {
      if (!pendingRequests.has(requestId)) return

      pendingRequests.delete(requestId)
      console.error('[Mojito] Timeout waiting for background response')
      postToPage({
        type: 'MINTLAYER_RESPONSE',
        requestId,
        error: {
          code: 'TIMEOUT',
          message: 'The wallet did not respond in time. Please try again.',
        },
      })
    }, RESPONSE_TIMEOUT_MS)

    pendingRequests.set(requestId, timeoutId)

    api.runtime.sendMessage(
      {
        requestId,
        method: event.data.method,
        params: event.data.params || {},
      },
      (response) => {
        if (!pendingRequests.has(requestId)) return

        clearTimeout(pendingRequests.get(requestId))
        pendingRequests.delete(requestId)

        if (api.runtime.lastError) {
          console.error('[Mojito] Runtime error:', api.runtime.lastError)
          postToPage({
            type: 'MINTLAYER_RESPONSE',
            requestId,
            error: {
              code: 'EXTENSION_ERROR',
              message:
                api.runtime.lastError.message ||
                'Could not reach the wallet. Is it installed and enabled?',
            },
          })
          return
        }

        postToPage({
          type: 'MINTLAYER_RESPONSE',
          requestId,
          result: response?.result,
          error: response?.error,
        })
      },
    )
  })
})()
