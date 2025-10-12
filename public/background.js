/* eslint-disable no-undef */
/* global chrome */

;(function () {
  // Detect browser API (Chrome or Firefox)
  const api = typeof browser !== 'undefined' ? browser : chrome

  // Track popup window IDs
  let popupWindowId = false
  let connectWindowId = false
  let connectedSites = {}
  const pendingResponses = new Map()

  // Load connected sites from storage
  api.storage.local.get(['connectedSites'], (data) => {
    if (api.runtime.lastError) {
      console.error('[Mintlayer] Storage get error:', api.runtime.lastError)
      return
    }
    connectedSites = data.connectedSites || {}
    console.log('[Mintlayer] Connected sites loaded:', connectedSites)
  })

  // Single listener for all messages
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Mintlayer] Received message:', message, 'from', sender)

    const origin = sender.origin || 'unknown'

    // Handle requests from content.js
    if (message.method) {
      if (message.method === 'checkConnection') {
        sendResponse({
          result: { isConnected: !!connectedSites[origin] },
        })
      } else if (message.method === 'connect') {
        if (connectWindowId === false) {
          pendingResponses.set(message.requestId, sendResponse)
          api.windows.create(
            {
              url: api.runtime.getURL('popup.html'),
              type: 'popup',
              width: 800,
              height: 600,
              focused: true,
            },
            (win) => {
              connectWindowId = win.id
              api.storage.local.set(
                {
                  pendingRequest: {
                    origin,
                    requestId: message.requestId,
                    // networkType: message.params.networkType,
                    // permission: message.params.permission,
                    action: 'connect',
                  },
                },
                () => {
                  if (api.runtime.lastError) {
                    console.error(
                      '[Mintlayer] Storage set error:',
                      api.runtime.lastError,
                    )
                  }
                },
              )
            },
          )
          return true // Keep channel open
        } else if (typeof connectWindowId === 'number') {
          api.windows.update(connectWindowId, { focused: true })
          sendResponse({ error: 'Connection window already open' })
        }
      } else if (message.method === 'signTransaction') {
        if (!connectedSites[origin]) {
          sendResponse({ error: 'Not connected. Call connect first.' })
        } else if (popupWindowId === false) {
          pendingResponses.set(message.requestId, sendResponse)
          api.windows.create(
            {
              url: api.runtime.getURL('popup.html'),
              type: 'popup',
              width: 800,
              height: 600,
              focused: true,
            },
            (win) => {
              popupWindowId = win.id
              api.storage.local.set(
                {
                  pendingRequest: {
                    origin,
                    requestId: message.requestId,
                    action: 'signTransaction',
                    data: message.params || {},
                  },
                },
                () => {
                  if (api.runtime.lastError) {
                    console.error(
                      '[Mintlayer] Storage set error:',
                      api.runtime.lastError,
                    )
                  }
                },
              )
            },
          )
          return true
        } else if (typeof popupWindowId === 'number') {
          api.windows.update(popupWindowId, { focused: true })
          sendResponse({ error: 'Transaction signing window already open' })
        }
      } else if (message.method === 'signChallenge') {
        if (!connectedSites[origin]) {
          sendResponse({ error: 'Not connected. Call connect first.' })
        } else if (popupWindowId === false) {
          pendingResponses.set(message.requestId, sendResponse)
          api.windows.create(
            {
              url: api.runtime.getURL('popup.html'),
              type: 'popup',
              width: 800,
              height: 600,
              focused: true,
            },
            (win) => {
              popupWindowId = win.id
              api.storage.local.set(
                {
                  pendingRequest: {
                    origin,
                    requestId: message.requestId,
                    action: 'signChallenge',
                    data: message.params || {},
                  },
                },
                () => {
                  if (api.runtime.lastError) {
                    console.error(
                      '[Mintlayer] Storage set error:',
                      api.runtime.lastError,
                    )
                  }
                },
              )
            },
          )
          return true
        } else if (typeof popupWindowId === 'number') {
          api.windows.update(popupWindowId, { focused: true })
          sendResponse({ error: 'Transaction signing window already open' })
        }
      } else if (message.method === 'version') {
        sendResponse({ result: api.runtime.getManifest().version })
      } else if (message.method === 'getSession') {
        const sessionOrigin = message.origin || sender.origin
        const session = connectedSites[sessionOrigin]

        if (session && session.address) {
          sendResponse({
            result: {
              address: session.address,
            },
          })
        } else {
          sendResponse({ result: null })
        }

        return true
      } else {
        sendResponse({ error: 'Unknown method' })
      }
    }

    // Handle popup responses
    if (message.action === 'popupResponse') {
      const { requestId, origin, result, error } = message
      const storedSendResponse = pendingResponses.get(requestId)
      if (result && message.method === 'connect') {
        connectedSites[origin] = {
          address: result.address,
          timestamp: Date.now(),
        }
        api.storage.local.set({ connectedSites }, () => {
          if (api.runtime.lastError) {
            console.error(
              '[Mintlayer] Storage set error:',
              api.runtime.lastError,
            )
          }

          if (storedSendResponse) {
            storedSendResponse({ result, error })
            pendingResponses.delete(requestId)
          }
        })
      } else if (result && message.method === 'signTransaction_approve') {
        storedSendResponse({ result, error })
        pendingResponses.delete(requestId)
      } else if (result && message.method === 'signTransaction_reject') {
        storedSendResponse({ result, error })
        pendingResponses.delete(requestId)
      } else if (result && message.method === 'signChallenge_approve') {
        storedSendResponse({ result, error })
        pendingResponses.delete(requestId)
      } else if (result && message.method === 'signChallenge_reject') {
        storedSendResponse({ result, error })
        pendingResponses.delete(requestId)
      } else {
        api.runtime.sendMessage({ requestId, result, error }, (response) => {
          if (api.runtime.lastError) {
            console.error(
              '[Mintlayer] Send response error:',
              api.runtime.lastError,
            )
          }
        })
      }
    }
  })

  // Clean up window IDs
  api.windows.onRemoved.addListener((winId) => {
    if (popupWindowId === winId) popupWindowId = false
    if (connectWindowId === winId) connectWindowId = false
  })

  console.log('[Mintlayer Extension] Background script loaded')
})()
