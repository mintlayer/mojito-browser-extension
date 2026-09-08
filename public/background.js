/* eslint-disable no-undef */
/* global chrome */

;(function () {
  // Detect browser API (Chrome or Firefox)
  const api = typeof browser !== 'undefined' ? browser : chrome

  // One slot tracks the state of each approval window: connect vs signing.
  const createApprovalSlot = () => ({
    id: false,
    opening: false,
    requestId: null,
  })

  const popupSlot = createApprovalSlot()
  const connectSlot = createApprovalSlot()
  let connectedSites = {}
  const pendingResponses = new Map()

  // Open the wallet in the browser side panel when the toolbar icon is clicked
  if (api.sidePanel && api.sidePanel.setPanelBehavior) {
    api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error('[Mintlayer] setPanelBehavior error:', error),
      )
  }

  // Firefox has no side panel: open the sidebar instead
  if (api.sidebarAction && api.action && api.action.onClicked) {
    api.action.onClicked.addListener(() => {
      api.sidebarAction.open().catch((error) => {
        console.error('[Mintlayer] sidebarAction.open error:', error)
      })
    })
  }

  // Load connected sites from storage. Messages arriving before the load
  // completes are queued: acting on a half-loaded session map would tell
  // already-connected sites they are NOT_CONNECTED.
  let connectedSitesLoaded = false
  const messageQueue = []
  api.storage.local.get(['connectedSites'], (data) => {
    if (api.runtime.lastError) {
      console.error('[Mintlayer] Storage get error:', api.runtime.lastError)
    } else {
      connectedSites = data.connectedSites || {}
    }
    // one-time cleanup of the pre-window-keyed pending request
    api.storage.local.remove('pendingRequest')
    connectedSitesLoaded = true
    for (const [queuedMessage, queuedSender, queuedResponse] of messageQueue) {
      processMessage(queuedMessage, queuedSender, queuedResponse)
    }
    messageQueue.length = 0
  })

  const pendingRequestKeyFor = (windowId) => `pendingRequest:${windowId}`

  const clearPendingRequest = (windowId) => {
    if (typeof windowId !== 'number') return
    api.storage.local.remove(pendingRequestKeyFor(windowId), () => {
      if (api.runtime.lastError) {
        console.error(
          '[Mintlayer] Storage remove error:',
          api.runtime.lastError,
        )
      }
    })
  }

  const getRequestOrigin = (sender) => {
    if (sender.origin) return sender.origin

    try {
      return sender.url ? new URL(sender.url).origin : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // Errors sent to dApps are `{ code, message }` so the caller can
  // distinguish rejected / cancelled / busy / not-connected without string
  // sniffing. Keep messages free of wallet-brand words: the bridge shows an
  // "install the wallet" hint when an error message matches /mojito/i.
  const errorOf = (code, message) => ({ code, message })

  // Approval responses and disconnections must come from the wallet's own
  // pages, never from a content script injected into a website.
  const isFromExtensionPage = (sender) =>
    sender.id === api.runtime.id &&
    typeof sender.url === 'string' &&
    sender.url.startsWith(api.runtime.getURL(''))

  const focusWindow = (windowId) => {
    api.windows.update(windowId, { focused: true }, () => {
      if (api.runtime.lastError) {
        console.error('[Mintlayer] Window focus error:', api.runtime.lastError)
      }
    })
  }

  // Fails a pending approval: clears the slot and answers the waiting dApp.
  const failSlot = (slot, error) => {
    const windowId = slot.id
    slot.id = false
    slot.opening = false

    if (!slot.requestId) return

    const respond = pendingResponses.get(slot.requestId)
    pendingResponses.delete(slot.requestId)
    slot.requestId = null
    clearPendingRequest(windowId)
    respond?.({ error })
  }

  // Opens one approval window for the request and keeps the dApp's message
  // channel open until the wallet answers. Returns true while waiting.
  const openApprovalWindow = (slot, request, sendResponse) => {
    if (typeof slot.id === 'number' || slot.opening) {
      if (typeof slot.id === 'number') focusWindow(slot.id)
      sendResponse({
        error: errorOf(
          'REQUEST_IN_PROGRESS',
          'An approval window is already open. Complete or close it first.',
        ),
      })
      return false
    }

    slot.opening = true
    slot.requestId = request.requestId
    pendingResponses.set(request.requestId, sendResponse)

    api.windows.create(
      {
        url: api.runtime.getURL('popup.html'),
        type: 'popup',
        width: 800,
        height: 600,
        focused: true,
      },
      (win) => {
        slot.opening = false
        slot.id = win?.id ?? false

        if (typeof slot.id !== 'number') {
          failSlot(slot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
          return
        }

        // The window may have been closed while it was being created, in
        // which case onRemoved fired before the id was tracked.
        api.windows.get(slot.id, (existing) => {
          if (api.runtime.lastError || !existing) {
            // check lastError: a failed lookup used to log
            // "Unchecked runtime.lastError" alongside the intended path
            failSlot(slot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
            return
          }

          // Keyed by window id: two approval windows can be open at once
          // (a connect and a signing) and must never overwrite each other's
          // request — the popup approves what ITS window was opened for.
          api.storage.local.set(
            { [pendingRequestKeyFor(slot.id)]: request },
            () => {
              if (api.runtime.lastError) {
                console.error(
                  '[Mintlayer] Storage set error:',
                  api.runtime.lastError,
                )
                failSlot(
                  slot,
                  errorOf(
                    'STORAGE_ERROR',
                    'Could not create the wallet request. Please try again.',
                  ),
                )
              }
            },
          )
        })
      },
    )

    return true
  }

  // Handle popup responses from the wallet UI
  const handlePopupResponse = (message) => {
    const { requestId, origin, result, error, method, windowId } = message
    const respond = pendingResponses.get(requestId)
    pendingResponses.delete(requestId)
    clearPendingRequest(windowId)

    if (!respond) {
      console.warn('[Mintlayer] Response for unknown request:', requestId)
      return
    }

    const rejected =
      !result || Boolean(error) || (method && method.endsWith('_reject'))

    if (rejected) {
      respond({
        error:
          error ||
          errorOf('USER_REJECTED', 'User rejected the request in the wallet'),
      })
      return
    }

    if (method === 'connect' && origin) {
      connectedSites[origin] = {
        // `address` is the network-keyed map for the injected SDK's
        // isConnected(); `addressesByChain` is what the @mintlayer/sdk
        // Client.connect()/restore() consume; `network` records which
        // network the grant was made on so signing can detect a switch.
        address: result.address,
        addressesByChain: result.addressesByChain,
        network: result.network,
        timestamp: Date.now(),
      }
      api.storage.local.set({ connectedSites }, () => {
        if (api.runtime.lastError) {
          console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
          respond({
            error: errorOf(
              'STORAGE_ERROR',
              'Could not save the wallet connection. Please try again.',
            ),
          })
          return
        }
        respond({ result })
      })
      return
    }

    respond({ result, error })
  }

  const processMessage = (message, sender, sendResponse) => {
    const origin = getRequestOrigin(sender)

    // Wallet-UI-only actions. These must be checked before dApp requests:
    // approval messages also carry a method field.
    if (message.action === 'popupResponse') {
      if (!isFromExtensionPage(sender)) return false
      handlePopupResponse(message)
      return false
    }

    if (message.action === 'disconnectSite') {
      if (!isFromExtensionPage(sender)) return false

      const targetOrigin = message.origin

      if (!targetOrigin || !connectedSites[targetOrigin]) {
        sendResponse({ result: null })
        return false
      }

      delete connectedSites[targetOrigin]
      api.storage.local.set({ connectedSites }, () => {
        if (api.runtime.lastError) {
          console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
          sendResponse({ error: api.runtime.lastError.message })
          return
        }
        sendResponse({ result: { origin: targetOrigin } })
      })
      return true
    }

    if (!message.method) return false

    // Handle requests from content.js
    if (message.method === 'checkConnection') {
      sendResponse({
        result: { isConnected: !!connectedSites[origin] },
      })
    } else if (message.method === 'connect') {
      // Already connected: answer immediately instead of asking again.
      if (connectedSites[origin]) {
        sendResponse({ result: connectedSites[origin] })
        return false
      }

      return openApprovalWindow(
        connectSlot,
        {
          origin,
          requestId: message.requestId,
          permissions: message.params?.permissions || [],
          action: 'connect',
        },
        sendResponse,
      )
    } else if (message.method === 'signTransaction') {
      if (!connectedSites[origin]) {
        sendResponse({
          error: errorOf(
            'NOT_CONNECTED',
            'This site is not connected to the wallet. Call connect first.',
          ),
        })
        return false
      }

      return openApprovalWindow(
        popupSlot,
        {
          origin,
          requestId: message.requestId,
          action: 'signTransaction',
          data: message.params || {},
          // The network the grant was made on: the approval UI compares it
          // with the wallet's active network so we never sign on the wrong
          // chain after a network switch.
          network: connectedSites[origin]?.network,
        },
        sendResponse,
      )
    } else if (message.method === 'signChallenge') {
      if (!connectedSites[origin]) {
        sendResponse({
          error: errorOf(
            'NOT_CONNECTED',
            'This site is not connected to the wallet. Call connect first.',
          ),
        })
        return false
      }

      return openApprovalWindow(
        popupSlot,
        {
          origin,
          requestId: message.requestId,
          action: 'signChallenge',
          data: message.params || {},
          network: connectedSites[origin]?.network,
        },
        sendResponse,
      )
    } else if (message.method === 'version') {
      sendResponse({ result: api.runtime.getManifest().version })
    } else if (message.method === 'disconnect') {
      if (connectedSites[origin]) {
        delete connectedSites[origin]
        api.storage.local.set({ connectedSites }, () => {
          if (api.runtime.lastError) {
            console.error(
              '[Mintlayer] Storage set error:',
              api.runtime.lastError,
            )
            sendResponse({
              error: errorOf(
                'STORAGE_ERROR',
                'Could not disconnect the site. Please try again.',
              ),
            })
            return
          }
          sendResponse({ result: true })
        })
        return true
      }

      sendResponse({ result: true })
    } else if (message.method === 'getSession') {
      // Origin MUST come from the browser's `sender` — a caller-supplied
      // origin would let any page read another origin's session.
      const session = connectedSites[origin]

      if (session && session.address) {
        sendResponse({
          result: {
            address: session.address,
            addressesByChain: session.addressesByChain,
            network: session.network,
          },
        })
      } else {
        sendResponse({ result: null })
      }

      return true
    } else {
      sendResponse({
        error: errorOf(
          'UNSUPPORTED_METHOD',
          `Unsupported wallet method: ${message.method}`,
        ),
      })
    }

    return false
  }

  // Single listener for all messages. Queue everything until the persisted
  // session map is loaded — answering a "connect" against a half-loaded map
  // would tell already-connected sites they are not connected.
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!connectedSitesLoaded) {
      messageQueue.push([message, sender, sendResponse])
      return true
    }
    return processMessage(message, sender, sendResponse)
  })

  // Clean up window state and answer waiting dApps when an approval window
  // is closed without a decision.
  api.windows.onRemoved.addListener((winId) => {
    if (popupSlot.id === winId) {
      failSlot(popupSlot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
    }
    if (connectSlot.id === winId) {
      failSlot(connectSlot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
    }
  })

  console.log('[Mintlayer Extension] Background script loaded')
})()
