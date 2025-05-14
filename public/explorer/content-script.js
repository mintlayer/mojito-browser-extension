/* eslint-disable no-undef */
;(function () {
  const api = typeof browser !== 'undefined' ? browser : chrome

  // Inject mojito.js into the page
  try {
    const script = document.createElement('script')
    script.src = api.runtime.getURL('mojito.js')
    script.onload = () => script.remove()
    ;(document.head || document.documentElement).appendChild(script)
  } catch (err) {
    console.error('[Content] Failed to inject Mojito SDK:', err)
  }

  const origin = window.location.origin

  chrome.runtime.sendMessage({ action: 'getSession', origin }, (res) => {
    if (res?.session) {
      console.log('[Mojito] Session restored:', res.session)
      window.postMessage(
        {
          type: 'MINTLAYER_EVENT',
          event: 'accountsChanged',
          data: res.session.address,
        },
        '*',
      )
    }
  })

  window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'MINTLAYER_REQUEST') {
      console.log('[Content] Received from SDK:', event.data)

      const requestData = {
        requestId: event.data.requestId,
        method: event.data.method,
        params: event.data.params || {},
      }

      const message =
        typeof cloneInto !== 'undefined'
          ? cloneInto(requestData, window)
          : requestData

      // Send message to background with timeout
      api.runtime.sendMessage(message, (response) => {
        if (api.runtime.lastError) {
          console.error('[Content] Runtime error:', api.runtime.lastError)
          window.postMessage(
            {
              type: 'MINTLAYER_RESPONSE',
              requestId: event.data.requestId,
              error:
                api.runtime.lastError.message ||
                'Could not connect to background',
            },
            '*',
          )
          return
        }

        console.log('[Content] Response from background:', response)
        const responseData = {
          type: 'MINTLAYER_RESPONSE',
          requestId: event.data.requestId,
          result: response && response.result,
          error: response && response.error,
        }

        const responseMessage =
          typeof cloneInto !== 'undefined'
            ? cloneInto(responseData, window)
            : responseData
        window.postMessage(responseMessage, '*')
      })

      // Timeout fallback
      setTimeout(() => {
        if (!pendingResponses.has(event.data.requestId)) {
          console.error('[Content] Timeout waiting for background response')
          window.postMessage(
            {
              type: 'MINTLAYER_RESPONSE',
              requestId: event.data.requestId,
              error: 'Response timeout from background',
            },
            '*',
          )
        }
      }, 1000 * 120) // 2-minute timeout
    }
  })

  const pendingResponses = new Set() // Track pending requests
})()
