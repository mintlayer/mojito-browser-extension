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

  // Instance ownership: on extension reload/update Chrome injects a fresh
  // content script into already-open pages while the orphaned one keeps its
  // message listener. The last injected instance owns the channel; orphans
  // stop answering so they cannot poison the fresh instance's responses.
  const OWNER_KEY = '__mojitoContentScriptOwner'
  const myInstanceId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  window[OWNER_KEY] = myInstanceId

  // True once this (still-owning) instance discovers the extension context
  // is gone: every further request is answered immediately with a clear
  // error instead of hanging until the timeout.
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

  // Self-healing ping: the background pings every tab on extension
  // install/update/reload and re-injects this script where the ping fails.
  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'MOJITO_PING') {
      sendResponse({ pong: true })
    }
  })

  // Revocation propagation: the wallet notifies this tab when its origin's
  // grant is revoked (settings disconnect / dApp disconnect). Relay it to
  // the page so its SDK client drops the stale session.
  api.runtime.onMessage.addListener((message) => {
    if (
      message?.type === 'MOJITO_SESSION_REVOKED' &&
      message.origin === window.location.origin
    ) {
      postToPage({
        type: 'MINTLAYER_EVENT',
        event: 'disconnect',
        data: { origin: message.origin },
      })
    }
  })

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== 'MINTLAYER_REQUEST') {
      return
    }

    // An orphaned instance (superseded by a freshly injected one) must not
    // answer — its runtime channel is stale and would race the real one.
    if (window[OWNER_KEY] !== myInstanceId) return

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

          if (api.runtime.lastError) {
            console.error('[Mojito] Runtime error:', api.runtime.lastError)
            failRequest(
              requestId,
              'EXTENSION_ERROR',
              'Could not reach the wallet. Is it installed and enabled?',
            )
            return
          }

          clearTimeout(pendingRequests.get(requestId))
          pendingRequests.delete(requestId)

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
