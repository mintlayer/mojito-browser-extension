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

  // True once the extension has been reloaded/updated/disabled underneath
  // this orphaned content script: every runtime call will throw, so answer
  // immediately with a clear error instead of letting requests hang.
  let contextInvalidated = false

  const failRequest = (requestId, code, message) => {
    if (!pendingRequests.has(requestId)) return

    clearTimeout(pendingRequests.get(requestId))
    pendingRequests.delete(requestId)
    postToPage({
      type: 'MINTLAYER_RESPONSE',
      requestId,
      error: { code, message },
    })
  }

  // Tell pages with an existing session as soon as the content script loads.
  try {
    api.runtime.sendMessage({ method: 'getSession', origin }, (response) => {
      if (api.runtime.lastError || !response?.result) return

      postToPage({
        type: 'MINTLAYER_EVENT',
        event: 'accountsChanged',
        data: response.result.address,
      })
    })
  } catch (error) {
    // Nothing sensible to do at load time if the context is already gone.
    console.error('[Mojito] Extension context unavailable:', error.message)
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== 'MINTLAYER_REQUEST') {
      return
    }

    const requestId = event.data.requestId

    // Guard against duplicate requests and answer stale ids at once.
    if (pendingRequests.has(requestId)) return

    // Extension was reloaded/updated/disabled while this page stayed open:
    // the runtime channel is gone, so fail fast instead of hanging the
    // page's promise until the timeout.
    if (contextInvalidated) {
      postToPage({
        type: 'MINTLAYER_RESPONSE',
        requestId,
        error: {
          code: 'CONTEXT_INVALIDATED',
          message:
            'The wallet was reloaded or updated. Reload this page and connect again.',
        },
      })
      return
    }

    const timeoutId = setTimeout(() => {
      failRequest(
        requestId,
        'TIMEOUT',
        'The wallet did not respond in time. Please try again.',
      )
    }, RESPONSE_TIMEOUT_MS)

    pendingRequests.set(requestId, timeoutId)

    try {
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
            failRequest(
              requestId,
              'EXTENSION_ERROR',
              api.runtime.lastError.message ||
                'Could not reach the wallet. Is it installed and enabled?',
            )
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
    } catch (error) {
      // Thrown synchronously when the extension context has been
      // invalidated (extension reloaded/updated/disabled).
      console.error('[Mojito] Extension context invalidated:', error.message)
      contextInvalidated = true
      failRequest(
        requestId,
        'CONTEXT_INVALIDATED',
        'The wallet was reloaded or updated. Reload this page and connect again.',
      )
    }
  })
})()
